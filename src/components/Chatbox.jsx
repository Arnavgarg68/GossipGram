import React, { useRef, useState, useEffect } from 'react'
import { useSocket } from '../SocketContext';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify'
import './css/chatbox.css'
import send from '../assets/send-icon.png'
const Chatbox = () => {
    const roomi = sessionStorage.getItem('roomId');
    const usern = sessionStorage.getItem('username');
    const msgtext = useRef(null);
    const msgtoscroll = useRef(null);
    const navigate = useNavigate()
    const [msgs, setmsgs] = useState([]);
    const [useralert,setuseralert] = useState()
    const socket = useSocket();
    if (!roomi || !usern) {
        navigate('/');
    }
    const sendmsg = (e) => {
        e.preventDefault();
        console.log("object")
        if (!msgtext.current.value.trim(' ')) {
            toast.warning("Enter a valid message");
            return;
        }
        const obj = {
            username: usern,
            message: msgtext.current.value,
            time: new Date().toISOString(),
            roomId: roomi
        }
        msgtext.current.value = ""
        socket.emit('msg', obj);
    }
    useEffect(() => {
        if (socket) {
            socket.on('msg', (data) => {
                setmsgs((prevMsgs) => [...prevMsgs, data]);
                const arr = msgtoscroll.current
                arr.scrollTo({
                    top: arr.scrollHeight,
                    behavior: 'smooth',
                  });
            });
            socket.on('userAlert',(data)=>{
                setuseralert(data.message)
                console.log(data)
                setTimeout(()=>{
                    setuseralert("");
                },5000)
            })
        }
        return () => {
            if (socket) {
                socket.off('msg'); // Clean up the listener
                socket.off('userAlert'); // Clean up the listener
            }
        };
    }, [socket]);
    return (
        <div className='chatbox-main'>
            <ToastContainer />
            <div className="chatbox-inner">
                <div className="chatbox-area">
                    <div className="chatbox-room-info">
                        Room-{roomi}
                    </div>
                    <div className="chatbox-text-area" ref={msgtoscroll}>

                        {   
                            msgs.length > 0 ? msgs.map((e, idx) => {
                                const dateTime = new Date(e.time);
                                // Extract components
                                const year = dateTime.getFullYear();
                                const month = dateTime.getMonth() + 1; // Months are 0-indexed
                                const day = dateTime.getDate();
                                const hours = dateTime.getHours();
                                const minutes = dateTime.getMinutes();
                                return (
                                    <div className={`${e.socketId===socket.id?"chatbox-msg-box-right":"chatbox-msg-box-left"}`} key={idx}>
                                        <div className="chatbox-msg-username">{e.username}</div>
                                        <div className="chatbox-msg-text">{e.message}</div>
                                        <div className="chatbox-msg-time">
                                            {`${year}-${month > 9 ? month : `0${month}`}-${day} at ${hours} :${minutes>9?minutes:`0${minutes}`}`}
                                        </div>
                                    </div>)
                            }) : (<></>)
                            
                            
                        }
                        {
                            useralert?(
                                <div className="chatbox-useralert">
                                    {useralert}
                                </div>
                            ):(<></>)
                        }

                    </div>
                    <div className="chatbox-input-area">
                        <form onSubmit={sendmsg} className="chatbox-input-form">
                            <input autoFocus ref={msgtext} type="text" className='chatbox-send-msg' placeholder='Message'/>
                            <button className="chatbox-send-btn" onClick={sendmsg}>
                                <img src={send} alt="send" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Chatbox
