import Mail from '../../lib/Mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { user, meetup } = data;

    await Mail.sendMail({
      to: `${user.name} <${user.email}>`,
      subject: 'Nova Inscrição',
      template: 'subscription',
      context: {
        organizer: meetup.user.name,
        meetup: meetup.title,
        user: user.name,
      },
    });
  }
}

export default new SubscriptionMail();
