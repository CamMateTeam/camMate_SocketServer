
const http = require("http")
const Socket = require("websocket").server
const server = http.createServer(()=>{})

server.listen(3000,()=>{
    //console.log("server started on port 3000") 
})

//instantiate websocket
const webSocket = new Socket({httpServer:server})

//an array to hold the users
const users = []

//add some listener
webSocket.on('request',(req)=>{
    const connection = req.accept()
   
//add listener on our connection
    connection.on('message',(message)=>{
        const data = JSON.parse(message.utf8Data)
        console.log(data);
        const user = findUser(data.name) // find recieved name through socket in users arr
       
        switch(data.type){
            case "store_user":
                if(user !=null){
                    //if user exists
                    connection.send(JSON.stringify({
                        type:'user already exists'
                    }))
                    return

                }
                //if user no exists
                const newUser = {
                    name:data.name, conn: connection
                }
                users.push(newUser)
            break

            case "start_call":
                let userToCall = findUser(data.target) //check whether data.target is in users arr

                if(userToCall){ //if userToCall is valid we want to send a feedback to the user
                    connection.send(JSON.stringify({ 
                        type:"call_response", data:"user is ready for call"
                    }))
                } else{ // no valid responser 
                    connection.send(JSON.stringify({
                        type:"call_response", data:"user is not online"
                    }))
                }

            break
            
            case "create_offer":
                let userToReceiveOffer = findUser(data.target)

                if (userToReceiveOffer){ // if user already exists
                    userToReceiveOffer.conn.send(JSON.stringify({
                        type:"offer_received",
                        name:data.name,
                        data:data.data.sdp 
                    }))
                }
            break
                
            case "create_answer":
                let userToReceiveAnswer = findUser(data.target)
                if(userToReceiveAnswer){
                    userToReceiveAnswer.conn.send(JSON.stringify({
                        type:"answer_received",
                        name: data.name,
                        data:data.data.sdp //from 58 line and this 69 line , they exchange thir session description
                    }))
                }
            break

            case "ice_candidate":  // after they can exchange their ice candidate
                let userToReceiveIceCandidate = findUser(data.target)
                if(userToReceiveIceCandidate){
                    userToReceiveIceCandidate.conn.send(JSON.stringify({
                        type:"ice_candidate",
                        name:data.name,
                        data:{
                            sdpMLineIndex:data.data.sdpMLineIndex,
                            sdpMid:data.data.sdpMid,
                            sdpCandidate:data.data.sdpCandidate
                        }
                    }))
                }
            break


        }

    })
    
    connection.on('close', () =>{
        users.forEach( user => {
            if(user.conn === connection){  // this user is disconnected
                users.splice(users.indexOf(user),1) // delete from users arr
            }
        })
    })





})

const findUser = username =>{ //iterate the users array and find the specific user and return
    for(let i=0; i<users.length;i++){
        if(users[i].name === username)
        return users[i]
    }
}
