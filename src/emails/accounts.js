const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "piyushsinghania6@gmail.com",
    subject: "Account Created!, Thanks for joining in.",
    text: `We are glad to welcome you to the task-manager app ${name}. Make your days more productive by integrating task-manager into it. Also we would like to hear more from you by knowing how do you want to get along with the app? `,
  });
};

const sendCalcellationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "piyushsinghania6@gmail.com",
    subject: "We will miss you!",
    text:
      "Thanks for using our service! Is there anything which we could have done to keep you intact with us?",
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCalcellationEmail,
};
