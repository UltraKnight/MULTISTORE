const client = process.env.CLIENT_HOSTNAME;

// This file is exporting an Object with a single key/value pair.
// However, because this is not a part of the logic of the application
// it makes sense to abstract it to another file. Plus, it is now easily
// extensible if the application needs to send different email templates
// (eg. unsubscribe) in the future.
module.exports = {
  confirm: (id) => ({
    subject: 'Multistore Confirm Email',
    html: `
      <h2>Welcome to Multistore.</h2>
      <p>You just created a new account. Please, use the confirmation link to enable your access to the Dashboard.</p>
        <a href='${client}/confirm/${id}'>
          Click here to confirm your email.
        </a>
        <p>or copy and paste this link in your browser: ${client}/confirm/${id}</p>`,
  }),
};
