let APP_ID = "88c338ac10cb4b55bd5392ca78aecb65";

let token = null
let uid = String(Math.floor(Math.random() * 10000))

let client;
let channel;

let localStream ;
let remoteStream ;
let peerConnection;

const servers =  {
    iseServers : [
        {
            urls:['stun.l.google.com:19302','stun1.l.google.com:19302']
        }
    ]
}
let init = async () => {

    client = await AgoraRTM.createInstance('88c338ac10cb4b55bd5392ca78aecb65');
    await client.login({uid,token})
 
    channel = client.createChannel('main2');
    await channel.join();

    channel.on('MemberJoined',handleUserJoined)

    client.on("MessageFromPeer", handleMessageFromPeer)

    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true})
    document.getElementById('user1').srcObject = localStream

}
let handleMessageFromPeer = async (message, MemberId) => {

    
    message = JSON.parse(message.text)
    console.log('Message ',message)
    if(message.type === 'offer') {
        createAnswer(MemberId ,message.offer)
    }
    if(message.type === 'answer') {
        addAnswer(message.answer)
    }
    if(message.type === 'candidate') {
        if(peerConnection) {
            peerConnection.addIceCandidate(message.candidate)
        }
    }

}

let handleUserJoined = async (MemberId) => {
    console.log('New user Joined ',MemberId)
    createOffer(MemberId)
}

let createPeerConnection = async(MemberId) => {
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user2').srcObject = remoteStream

    if(!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true})
        document.getElementById('user1').srcObject = localStream
    }

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track,localStream)
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track)=>{
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate) {
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate','candidate':event.candidate})}, MemberId)
        }
    }
}

let createOffer = async (MemberId) => {
    
    await createPeerConnection(MemberId)
    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    client.sendMessageToPeer({text:JSON.stringify({'type':'offer','offer':offer})}, MemberId)
}

let createAnswer = async (MemberId, offer) => {
    await createPeerConnection(MemberId)

    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()

    await peerConnection.setLocalDescription(answer)

    client.sendMessageToPeer({text:JSON.stringify({'type': 'answer', 'answer': answer})}, MemberId)
}

let addAnswer = async (answer) => {
    if(!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer)
    }
}

init()