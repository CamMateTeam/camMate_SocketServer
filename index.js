const http = require("http");
const Socket = require("websocket").server;
const server = http.createServer(() => {});

server.listen(3000, () => {
  console.log("server started on port 3000");
});

const webSocket = new Socket({ httpServer: server });
let userMap = new Map();

webSocket.on("request", (req) => {
  const connection = req.accept();

  connection.on("message", (message) => {
    const data = JSON.parse(message.utf8Data);
    console.log(data);
    const user = findUser(data.name);

    switch (data.type) {
      case "store_user":
        if (user != null) {
          connection.send(
            JSON.stringify({
              type: "user already exists",
            })
          );
          return;
        }
        const newUser = {
          name: data.name,
          conn: connection,
        };
        userMap.set(data.name, newUser);
        break;

      case "start_call":
        let userToCall = findUser(data.target);

        if (userToCall) {
          connection.send(
            JSON.stringify({
              type: "call_response",
              data: "user is ready for call",
            })
          );
        } else {
          connection.send(
            JSON.stringify({
              type: "call_response",
              data: "user is not online",
            })
          );
        }

        break;

      case "create_offer":
        let userToReceiveOffer = findUser(data.target);

        if (userToReceiveOffer) {
          userToReceiveOffer.conn.send(
            JSON.stringify({
              type: "offer_received",
              name: data.name,
              data: data.data.sdp,
            })
          );
        }
        break;

      case "create_answer":
        let userToReceiveAnswer = findUser(data.target);
        if (userToReceiveAnswer) {
          userToReceiveAnswer.conn.send(
            JSON.stringify({
              type: "answer_received",
              name: data.name,
              data: data.data.sdp,
            })
          );
        }
        break;

      case "ice_candidate":
        let userToReceiveIceCandidate = findUser(data.target);
        if (userToReceiveIceCandidate) {
          userToReceiveIceCandidate.conn.send(
            JSON.stringify({
              type: "ice_candidate",
              name: data.name,
              data: {
                sdpMLineIndex: data.data.sdpMLineIndex,
                sdpMid: data.data.sdpMid,
                sdpCandidate: data.data.sdpCandidate,
              },
            })
          );
        }
        break;
    }
  });

  connection.on("close", () => {
    userMap.forEach((key, value) => {
      if (value.conn === connection) {
        userMap.delete(key);
      }
    });
  });
});

const findUser = (username) => {
  return userMap.get(username);
};
