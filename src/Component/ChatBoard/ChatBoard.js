import moment from 'moment'
import React, {Component, useState, useEffect} from 'react'
import ReactLoading from 'react-loading'
import 'react-toastify/dist/ReactToastify.css'
import {myFirestore, myStorage} from '../../Config/MyFirebase'
import images from '../Themes/Images'
import './ChatBoard.css'
import {AppString} from './../Const'
import ChatMessage from './Message.js'

// function ChatBoard(props) {
//     const [isLoading, setLoading] = useState(false)
//     const [isShowSticker, setShowSticker] = useState(false)
//     const [inputValue, setInputValue] = useState('')
//     const currentUserId = localStorage.getItem(AppString.ID)
//     const currentUserAvatar = localStorage.getItem(AppString.PHOTO_URL)
//     const currentUserNickname = localStorage.getItem(AppString.NICKNAME)
//     const listMessage = []
//     const currentPeerUser = props.currentPeerUser
//     const groupChatId = null
//     const removeListener = null
//     const currentPhotoFile = null

//     useEffect(() => {



//         return function cleanUp {
//             if (removeListener) {
//                 removeListener()
//             }
//         };
//     })

// }











export default class ChatBoard extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isLoading: false,
            isShowSticker: false,
            inputValue: ''
        }
        this.currentUserId = localStorage.getItem(AppString.ID)
        this.currentUserAvatar = localStorage.getItem(AppString.PHOTO_URL)
        this.currentUserNickname = localStorage.getItem(AppString.NICKNAME)
        this.listMessage = []
        this.currentPeerUser = this.props.currentPeerUser
        this.groupChatId = null
        this.removeListener = null
        this.currentPhotoFile = null
    }

    componentDidUpdate() {
        this.scrollToBottom()
    }

    componentDidMount() {
        // For first render, it's not go through componentWillReceiveProps
        this.getListHistory()
    }
    

    componentWillUnmount() {
        if (this.removeListener) {
            this.removeListener()
        }
    }

    componentWillReceiveProps(newProps) {
        if (newProps.currentPeerUser) {
            this.currentPeerUser = newProps.currentPeerUser
            this.getListHistory()
        }
    }

    getListHistory = () => {
        if (this.removeListener) {
            this.removeListener()
        }
        this.listMessage.length = 0
        this.setState({isLoading: true})
        if (
            this.hashString(this.currentUserId) <=
            this.hashString(this.currentPeerUser.id)
        ) {
            this.groupChatId = `${this.currentUserId}-${this.currentPeerUser.id}`
        } else {
            this.groupChatId = `${this.currentPeerUser.id}-${this.currentUserId}`
        }

        // Get history and listen new data added
        this.removeListener = myFirestore
            .collection(AppString.NODE_MESSAGES)
            .doc(this.groupChatId)
            .collection(this.groupChatId)
            .onSnapshot(
                snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === AppString.DOC_ADDED) {
                            this.listMessage.push(change.doc.data())
                        }
                    })
                    this.setState({isLoading: false})
                },
                err => {
                    this.props.showToast(0, err.toString())
                }
            )
    }

    openListSticker = () => {
        this.setState({isShowSticker: !this.state.isShowSticker})
    }

    onSendMessage = (content, type) => {
        if (this.state.isShowSticker && type === 2) {
            this.setState({isShowSticker: false})
        }

        if (content.trim() === '') {
            return
        }

        const timestamp = moment()
            .valueOf()
            .toString()

        const itemMessage = {
            idFrom: this.currentUserId,
            idTo: this.currentPeerUser.id,
            timestamp: timestamp,
            content: content.trim(),
            type: type
        }

        myFirestore
            .collection(AppString.NODE_MESSAGES)
            .doc(this.groupChatId)
            .collection(this.groupChatId)
            .doc(timestamp)
            .set(itemMessage)
            .then(() => {
                this.setState({inputValue: ''})
            })
            .catch(err => {
                this.props.showToast(0, err.toString())
            })
    }

    onChoosePhoto = event => {
        if (event.target.files && event.target.files[0]) {
            this.setState({isLoading: true})
            this.currentPhotoFile = event.target.files[0]
            // Check this file is an image?
            const prefixFiletype = event.target.files[0].type.toString()
            if (prefixFiletype.indexOf(AppString.PREFIX_IMAGE) === 0) {
                this.uploadPhoto()
            } else {
                this.setState({isLoading: false})
                this.props.showToast(0, 'This file is not an image')
            }
        } else {
            this.setState({isLoading: false})
        }
    }

    uploadPhoto = () => {
        if (this.currentPhotoFile) {
            const timestamp = moment()
                .valueOf()
                .toString()

            const uploadTask = myStorage
                .ref()
                .child(timestamp)
                .put(this.currentPhotoFile)

            uploadTask.on(
                AppString.UPLOAD_CHANGED,
                null,
                err => {
                    this.setState({isLoading: false})
                    this.props.showToast(0, err.message)
                },
                () => {
                    uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
                        this.setState({isLoading: false})
                        this.onSendMessage(downloadURL, 1)
                    })
                }
            )
        } else {
            this.setState({isLoading: false})
            this.props.showToast(0, 'File is null')
        }
    }

    onKeyboardPress = event => {
        if (event.key === 'Enter') {
            this.onSendMessage(this.state.inputValue, 0)
        }
    }

    scrollToBottom = () => {
        if (this.messagesEnd) {
            this.messagesEnd.scrollIntoView({})
        }
    }

    render() {
        return (
            <div className="viewChatBoard">
                {/* Header */}
                <div className="headerChatBoard">
                    <img
                        className="viewAvatarItem"
                        src={this.currentPeerUser.photoUrl}
                        alt="icon avatar"
                    />
                    <span className="textHeaderChatBoard">
            {this.currentPeerUser.nickname}
          </span>
                </div>

                {/* List message */}
                <div className="viewListContentChat">
                    {this.renderListMessage()}
                    <div
                        style={{float: 'left', clear: 'both'}}
                        ref={el => {
                            this.messagesEnd = el
                        }}
                    />
                </div>

                {/* Stickers */}
                {this.state.isShowSticker ? this.renderStickers() : null}

                {/* View bottom */}
                <div className="viewBottom">
                    <img
                        className="icOpenGallery"
                        src={images.ic_photo}
                        alt="icon open gallery"
                        onClick={() => this.refInput.click()}
                    />
                    <input
                        ref={el => {
                            this.refInput = el
                        }}
                        accept="image/*"
                        className="viewInputGallery"
                        type="file"
                        onChange={this.onChoosePhoto}
                    />

                    <img
                        className="icOpenSticker"
                        src={images.ic_sticker}
                        alt="icon open sticker"
                        onClick={this.openListSticker}
                    />

                    <input
                        className="viewInput"
                        placeholder="Type your message..."
                        value={this.state.inputValue}
                        onChange={event => {
                            this.setState({inputValue: event.target.value})
                        }}
                        onKeyPress={this.onKeyboardPress}
                    />
                    <img
                        className="icSend"
                        src={images.ic_send}
                        alt="icon send"
                        onClick={() => this.onSendMessage(this.state.inputValue, 0)}
                    />
                </div>

                {/* Loading */}
                {this.state.isLoading ? (
                    <div className="viewLoading">
                        <ReactLoading
                            type={'spin'}
                            color={'#203152'}
                            height={'3%'}
                            width={'3%'}
                        />
                    </div>
                ) : null}
            </div>
        )
    }

    renderListMessage = () => {
        if (this.listMessage.length > 0) {
            let viewListMessage = []
            this.listMessage.forEach((item, index) => {
                if (item.idFrom === this.currentUserId) {
                    // Item right (my message)
                    if (item.type === 0) {
                        viewListMessage.push(
                            <ChatMessage key={item.timestamp} fromCurrentUser={true} timestamp={item.timestamp} content={item.content} />
                        )
                    } else if (item.type === 1) {
                        viewListMessage.push(
                            <div className="viewItemRight2" key={item.timestamp}>
                                <img
                                    className="imgItemRight"
                                    src={item.content}
                                    alt="content message"
                                />
                            </div>
                        )
                    } else {
                        viewListMessage.push(
                            <div className="viewItemRight3" key={item.timestamp}>
                                <img
                                    className="imgItemRight"
                                    src={this.getGifImage(item.content)}
                                    alt="content message"
                                />
                            </div>
                        )
                    }
                } else {
                    // Item left (peer message)
                    if (item.type === 0) {
                        viewListMessage.push(
                            <ChatMessage key={item.timestamp} fromCurrentUser={false} timestamp={item.timestamp} content={item.content} isLastMessageLeft={this.isLastMessageLeft(index)} profilePicUrl={this.currentPeerUser.photoUrl}/>
                        )
                    } else if (item.type === 1) {
                        viewListMessage.push(
                            <div className="viewWrapItemLeft2" key={item.timestamp}>
                                <div className="viewWrapItemLeft3">
                                    {this.isLastMessageLeft(index) ? (
                                        <img
                                            src={this.currentPeerUser.photoUrl}
                                            alt="avatar"
                                            className="peerAvatarLeft"
                                        />
                                    ) : (
                                        <div className="viewPaddingLeft"/>
                                    )}
                                    <div className="viewItemLeft2">
                                        <img
                                            className="imgItemLeft"
                                            src={item.content}
                                            alt="content message"
                                        />
                                    </div>
                                </div>
                                {this.isLastMessageLeft(index) ? (
                                    <span className="textTimeLeft">
                    {moment(Number(item.timestamp)).format('ll')}
                  </span>
                                ) : null}
                            </div>
                        )
                    } else {
                        viewListMessage.push(
                            <div className="viewWrapItemLeft2" key={item.timestamp}>
                                <div className="viewWrapItemLeft3">
                                    {this.isLastMessageLeft(index) ? (
                                        <img
                                            src={this.currentPeerUser.photoUrl}
                                            alt="avatar"
                                            className="peerAvatarLeft"
                                        />
                                    ) : (
                                        <div className="viewPaddingLeft"/>
                                    )}
                                    <div className="viewItemLeft3" key={item.timestamp}>
                                        <img
                                            className="imgItemLeft"
                                            src={this.getGifImage(item.content)}
                                            alt="content message"
                                        />
                                    </div>
                                </div>
                                {this.isLastMessageLeft(index) ? (
                                    <span className="textTimeLeft">
                    {moment(Number(item.timestamp)).format('ll')}
                  </span>
                                ) : null}
                            </div>
                        )
                    }
                }
            })
            return viewListMessage
        } else {
            return (
                <div className="viewWrapSayHi">
                    <span className="textSayHi">Say ahoy to your new crewmate</span>
                    <img
                        className="imgWaveHand"
                        src={images.ic_wave_hand}
                        alt="wave hand"
                    />
                </div>
            )
        }
    }

    renderStickers = () => {
        return (
            <div className="viewStickers">
                <img
                    className="imgSticker"
                    src={images.partyParrot}
                    alt="sticker"
                    onClick={() => this.onSendMessage('partyParrot', 2)}
                />
                <img
                    className="imgSticker"
                    src={images.dealWithItParrot}
                    alt="sticker"
                    onClick={() => this.onSendMessage('dealWithItParrot', 2)}
                />
                <img
                    className="imgSticker"
                    src={images.sadParrot}
                    alt="sticker"
                    onClick={() => this.onSendMessage('sadParrot', 2)}
                />
                <img
                    className="imgSticker"
                    src={images.sleepingParrot}
                    alt="sticker"
                    onClick={() => this.onSendMessage('sleepingParrot', 2)}
                />
                <img
                    className="imgSticker"
                    src={images.thumbsUpParrot}
                    alt="sticker"
                    onClick={() => this.onSendMessage('thumbsUpParrot', 2)}
                />
                <img
                    className="imgSticker"
                    src={images.spinningParrot}
                    alt="sticker"
                    onClick={() => this.onSendMessage('spinningParrot', 2)}
                />
                <img
                    className="imgSticker"
                    src={images.angryParrot}
                    alt="sticker"
                    onClick={() => this.onSendMessage('angryParrot', 2)}
                />
                <img
                    className="imgSticker"
                    src={images.confusedParrot}
                    alt="sticker"
                    onClick={() => this.onSendMessage('confusedParrot', 2)}
                />
                <img
                    className="imgSticker"
                    src={images.jumpingParrot}
                    alt="sticker"
                    onClick={() => this.onSendMessage('jumpingParrot', 2)}
                />
            </div>
        )
    }

    hashString = str => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash += Math.pow(str.charCodeAt(i) * 31, str.length - i)
            hash = hash & hash // Convert to 32bit integer
        }
        return hash
    }

    getGifImage = value => {
        switch (value) {
            case 'partyParrot':
                return images.partyParrot
            case 'dealWithItParrot':
                return images.dealWithItParrot
            case 'sadParrot':
                return images.sadParrot
            case 'sleepingParrot':
                return images.sleepingParrot
            case 'thumbsUpParrot':
                return images.thumbsUpParrot
            case 'spinningParrot':
                return images.spinningParrot
            case 'angryParrot':
                return images.angryParrot
            case 'confusedParrot':
                return images.confusedParrot
            case 'jumpingParrot':
                return images.jumpingParrot
            case 'mimi9':
                return images.mimi9
            default:
                return images.mimi9
        }
    }

    isLastMessageLeft(index) {
        if (
            (index + 1 < this.listMessage.length &&
                this.listMessage[index + 1].idFrom === this.currentUserId) ||
            index === this.listMessage.length - 1
        ) {
            return true
        } else {
            return false
        }
    }

    isLastMessageRight(index) {
        if (
            (index + 1 < this.listMessage.length &&
                this.listMessage[index + 1].idFrom !== this.currentUserId) ||
            index === this.listMessage.length - 1
        ) {
            return true
        } else {
            return false
        }
    }
}
