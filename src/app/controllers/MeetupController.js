import * as Yup from 'yup';
import { isBefore, parseISO } from 'date-fns';

import Meetup from '../models/Meetup';

class MeetupController {
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
}

export default new MeetupController();
