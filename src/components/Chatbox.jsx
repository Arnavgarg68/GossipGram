import React, { useRef, useState, useEffect } from 'react'
import { useSocket } from '../SocketContext';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify'
import emoji_icon from '../assets/emoji-icon.png'
import './css/chatbox.css'
import send from '../assets/send-icon.png'
const Chatbox = () => {
    const roomi = sessionStorage.getItem('roomId');
    const usern = sessionStorage.getItem('username');
    const msgtext = useRef(null);
    const msgtoscroll = useRef(null);
    const emojiBoxRef = useRef(null);
    const emojiIconref = useRef(null);
    const navigate = useNavigate()
    const [msgs, setmsgs] = useState([]);
    const [useralert, setuseralert] = useState()
    const [emojis, setemojis] = useState([]);
    const [emojistate, setemojistate] = useState(false);
    const socket = useSocket();
    if (!roomi || !usern) {
        navigate('/');
    }
    const sendmsg = (e) => {
        e.preventDefault();
        console.log("object")
        if(!socket.connected){
            toast.warning("Server down wait for sometime")
            return;
        }
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
        msgtext.current.focus();
        socket.emit('msg', obj);
    }
    const loademojis = async () => {
        try {
            if(emojis.length!==0){
                return;
            }
            const response = await fetch("https://emojihub.yurace.pro/api/all");
            if (!response.ok) {
                toast.error("Problem in loading emojis");
                return
            }
            const data = await response.json();
            setemojis(data);
        } catch (error) {
            toast.error("error catching in emoji ")
        }
    }
    const emojitotext = (emoji) => {
        const textArea = document.createElement('textarea');
        textArea.innerHTML = emoji.htmlCode;
        const decodedEmoji = textArea.value; // Get the actual emoji
        // Append the emoji to the current input value
        msgtext.current.value += decodedEmoji;
    }
    useEffect(() => {
        const handleClickOutside = (event) => {
            if(emojiIconref.current.contains(event.target)){
                setemojistate((e)=>!e)
                console.log("object")
                return;
            }
            if (emojiBoxRef.current && !emojiBoxRef.current.contains(event.target)) {
                setemojistate(false); // Close the emoji box
            }
        };

        const handlepopstate = (event)=>{
            socket.emit("user-left",{
                username:usern,
                socketId:socket.id,
                roomId:roomi
            })
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('popstate', handlepopstate);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('popstate', handlepopstate);

        };
    }, []);
    useEffect(() => {
        if (socket) {
            socket.on('msg', (data) => {
                setmsgs((prevMsgs) => [...prevMsgs, data]);
                setTimeout(()=>{
                    const arr = msgtoscroll.current
                arr.scrollTo({
                    top: arr.scrollHeight,
                    behavior: 'smooth',
                });
                },200)
            });
            socket.on('userAlert', (data) => {
                setuseralert(data.message)
                console.log(data)
                setTimeout(() => {
                    setuseralert("");
                }, 7000)
            })
            socket.on("error",(data)=>{
                toast.error(data.message + "redirect in 5sec");
                setTimeout(()=>{
                    navigate('/')
                },5000)
            })
        }
        return () => {
            if (socket) {
                socket.off('msg'); // Clean up the listener
                socket.off('userAlert'); // Clean up the listener
                socket.off('error');
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
                        {
                            useralert ? (
                                <div className="chatbox-useralert">
                                    {useralert}
                                </div>
                            ) : (<></>)
                        }
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
                                    <div className={`${e.socketId === socket.id ? "chatbox-msg-box-right" : "chatbox-msg-box-left"}`} key={idx}>
                                        <div className="chatbox-msg-username">{e.username}</div>
                                        <div className="chatbox-msg-text">{e.message}</div>
                                        <div className="chatbox-msg-time">
                                            {`${year}-${month > 9 ? month : `0${month}`}-${day} at ${hours > 9 ? hours : `0${hours}`} :${minutes > 9 ? minutes : `0${minutes}`}`}
                                        </div>
                                    </div>)
                            }) : (<></>)


                        }
                        

                    </div>
                    <div className="chatbox-input-area">
                        <form onSubmit={sendmsg} className="chatbox-input-form">
                            <div className="chatbox-emoji-box">
                                {emojistate ? <div className="chatbox-emoji-container" ref={emojiBoxRef}>
                                    {
                                        emojis.length > 0 ? emojis.map((emoji, idx) => (
                                            <div onClick={() => { emojitotext(emoji) }} key={idx} className="chatbox-emoji" dangerouslySetInnerHTML={{ __html: emoji.htmlCode }} />
                                        )) : (<></>)
                                    }
                                </div> : (<></>)}
                                <img src={emoji_icon} alt="" className="chatbox-emoji-box-icon" onClick={loademojis} ref={emojiIconref}/>
                            </div>
                            <input autoFocus ref={msgtext} type="text" className='chatbox-send-msg' placeholder='Message'/>
                            <button className="chatbox-send-btn" onClick={sendmsg} >
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
