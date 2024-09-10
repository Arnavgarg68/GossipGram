import React, { useEffect, useRef } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import { useSocket } from '../SocketContext'
import './css/homepage.css'
import { useNavigate } from 'react-router-dom'
const Homepage = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const usern = useRef(null);
    const usernc = useRef(null);
    const roomi = useRef(null);
    const roomic = useRef(null);
    const roompc = useRef(null);
    const handleSubmitjoin = (e) => {
        e.preventDefault();
        if (!usern.current.value.trim(' ')) {
            toast.error("User name invalid/empty")
            return
        }
        if (!roomi.current.value.trim(' ') || (isNaN(roomi.current.value)) || (roomi.current.value.trim(' ').length < 4)) {
            toast.error("Room ID invalid/empty note: minimum length 4")
            return;
        }
        if(!socket.connected){
            toast.warning("Server is down kindly try after sometime")
        }
        socket.emit('userjoined-room', {
            roomId: roomi.current.value,
            username: usern.current.value
        })
        let status = 0;
        socket.on("success", (e) => {
            status = e.status;
            toast.success(e.message);
        })
        setTimeout(()=>{
            if (status !== 0) {
                sessionStorage.setItem('roomId',roomi.current.value);
                sessionStorage.setItem('username',usern.current.value);
                toast("bye")
                navigate('/chatbox')
            }
        },500)

    }
    if (socket) {
        socket.on("error", (data) => {
            toast.error(data.message);
        })
    }
    const handleSubmitcreate = (e) => {
        e.preventDefault();
        if (!usernc.current.value.trim(' ')) {
            toast.error("User name invalid/empty")
            return
        }
        if (!roomic.current.value.trim(' ') || (isNaN(roomic.current.value)) || (roomic.current.value.trim(' ').length < 4)) {
            toast.error("Room ID invalid/empty note: minimum length 4")
            return;
        }
        if (!roompc.current.value.trim(' ') || (isNaN(roompc.current.value)) || (roompc.current.value.trim(' ') < 2 || roompc.current.value.trim(' ') > 20)) {
            toast.error("Number of participants should be between 2 and 20");
            return;
        }
        socket.on("success", (e) => {
            toast("formvalid")
        })

    }
    useEffect(() => {


    }, [])
    return (
        <div className='homepage-main'>
            <ToastContainer />
            <div className="homepage-inner">
                <h1>GossipGram</h1>
                <form onSubmit={handleSubmitjoin} className='homepage-join-room'>
                    <label >Join Room</label>
                    <input type="text" placeholder='username' ref={usern} className='homepage-username-input' />
                    <input type="number" placeholder='RoomId (minimum length 4)' ref={roomi} className='homepage-roomId-input' />
                    <button className='homepage-form-submit'>Join</button>
                </form>
                <form onSubmit={handleSubmitcreate} className='homepage-join-room'>
                    <label >Create Room</label>
                    <input type="text" placeholder='username' ref={usernc} className='homepage-username-input' />
                    <input type="number" placeholder='RoomId (minimum length 4)' ref={roomic} className='homepage-roomId-input' />
                    <input type="number" placeholder='room size (between 2 & 20)' ref={roompc} className='homepage-roomId-input' />
                    <button className='homepage-form-submit'>Create</button>
                </form>
            </div>
        </div>
    )
}

export default Homepage
