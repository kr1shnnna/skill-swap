const connectedUsers = {};

const addUser = (userId, socketId) => {
  connectedUsers[userId] = socketId;
};

const removeUser = (socketId) => {
  for (const userId in connectedUsers) {
    if (connectedUsers[userId] === socketId) {
      delete connectedUsers[userId];
    }
  }
};

const getUserSocket = (userId) => {
  return connectedUsers[userId];
};

module.exports = {
  addUser,
  removeUser,
  getUserSocket,
};
