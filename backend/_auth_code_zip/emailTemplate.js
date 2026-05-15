 const emailTemplate = ({ username, restlink }) => {
  return (
   ` <div>
      <h1>Hello, ${username}</h1>
      <p>
        Click here to reset your password - <a href="${restlink}">resetlink</a>
      </p>
    </div>`
  );
};

module.exports = emailTemplate;
