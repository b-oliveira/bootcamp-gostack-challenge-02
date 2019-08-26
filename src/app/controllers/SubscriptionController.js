import { Op } from 'sequelize';
import User from '../models/User';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';

import SubscriptionMail from '../jobs/SubscriptionMail';
import Queue from '../../lib/Queue';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      attributes: ['id', 'user_id'],
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          attributes: [
            'past',
            'id',
            'title',
            'description',
            'location',
            'date',
          ],
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
        },
      ],
      order: [
        [
          {
            model: Meetup,
            as: 'meetup',
          },
          'date',
        ],
      ],
    });

    return res.json(subscriptions);
  }

  async store(req, res) {
    const user = await User.findByPk(req.userId);
    const meetup = await Meetup.findByPk(req.params.meetupId, {
      include: 'user',
    });

    if (meetup.user_id === req.userId)
      return res.status(400).json({
        error: 'Não é possível se inscrever em um meetup organizado por você!',
      });

    if (meetup.past)
      return res.status(400).json({
        error: 'Não é possível se inscrever em meetups que já aconteceram!',
      });

    const checkDate = await Subscription.findOne({
      where: {
        user_id: user.id,
      },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res.status(400).json({
        error:
          'Não é possível se inscrever em meetups que acontecerão ao mesmo tempo!',
      });
    }

    const subscription = await Subscription.create({
      user_id: user.id,
      meetup_id: meetup.id,
    });

    await Queue.add(SubscriptionMail.key, {
      user,
      meetup,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
