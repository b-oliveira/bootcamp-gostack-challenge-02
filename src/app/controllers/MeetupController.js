import * as Yup from 'yup';
import { Op } from 'sequelize';
import { isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';

import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const where = {};
    const page = req.query.page || 1;

    if (req.query.date) {
      const searchDate = parseISO(req.query.date);

      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    const meetups = await Meetup.findAll({
      attributes: ['id', 'title', 'description', 'location', 'date', 'past'],
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      limit: 10,
      offset: 10 * page - 10,
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      user_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Campos inválidos!' });

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'Data inválida!' });
    }

    const meetup = await Meetup.create(req.body);

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      user_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Campos inválidos!' });

    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== req.userId)
      return res.status(401).json({ error: 'Operação não autorizada!' });

    if (isBefore(parseISO(req.body.date), new Date()))
      return res.status(400).json({ error: 'Data inválida!' });

    if (meetup.past)
      return res
        .status(400)
        .json({ error: 'Não é possível atualizar um evento encerrado!' });

    await meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== req.userId)
      return res.status(401).json({ error: 'Operação não autorizada!' });

    if (meetup.past) return res.status(400).json({ error: 'Data inválida!' });

    await meetup.destroy();

    return res.send();
  }
}

export default new MeetupController();
