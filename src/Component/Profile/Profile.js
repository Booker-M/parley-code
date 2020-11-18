import React, {Component} from 'react'
import ReactLoading from 'react-loading'
import {withRouter} from 'react-router-dom'
import 'react-toastify/dist/ReactToastify.css'
import {myFirestore, myStorage} from '../../Config/MyFirebase'
import images from './../Themes/Images'
import './Profile.css'
import {AppString} from './../Const'
import {listLanguagesWithTarget} from '../../Config/MyTranslate.js'
import Header from './../Header/Header'

class Profile extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isLoading: false,
            id: localStorage.getItem(AppString.ID),
            nickname: localStorage.getItem(AppString.NICKNAME),
            aboutMe: localStorage.getItem(AppString.ABOUT_ME),
            photoUrl: localStorage.getItem(AppString.PHOTO_URL),
            myLanguage: localStorage.getItem(AppString.MY_LANGUAGE),
            languages: []
        }
        this.newAvatar = null
        this.newPhotoUrl = ''
    }

    componentDidMount() {
        this.checkLogin()
        this.updateLanguages()
    }

    async updateLanguages() {
        this.setState({languages: await listLanguagesWithTarget()})
    }

    checkLogin = () => {
        if (!localStorage.getItem(AppString.ID)) {
            this.props.history.push('/')
        }
    }

    onChangeNickname = event => {
        this.setState({nickname: event.target.value})
    }

    onChangeAboutMe = event => {
        this.setState({aboutMe: event.target.value})
    }

    onChangeMyLanguage = event => {
        this.setState({myLanguage: event.target.value ? event.target.value : this.state.myLanguage})
        this.updateLanguages()
    }

    onChangeAvatar = event => {
        if (event.target.files && event.target.files[0]) {
            // Check this file is an image?
            const prefixFiletype = event.target.files[0].type.toString()
            if (prefixFiletype.indexOf(AppString.PREFIX_IMAGE) !== 0) {
                this.props.showToast(0, 'This file is not an image')
                return
            }
            this.newAvatar = event.target.files[0]
            this.setState({photoUrl: URL.createObjectURL(event.target.files[0])})
        } else {
            this.props.showToast(0, 'Something wrong with input file')
        }
    }

    uploadAvatar = () => {
        this.setState({isLoading: true})
        if (this.newAvatar) {
            const uploadTask = myStorage
                .ref()
                .child(this.state.id)
                .put(this.newAvatar)
            uploadTask.on(
                AppString.UPLOAD_CHANGED,
                null,
                err => {
                    this.props.showToast(0, err.message)
                },
                () => {
                    uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
                        this.updateUserInfo(true, downloadURL)
                    })
                }
            )
        } else {
            this.updateUserInfo(false, null)
        }
    }

    updateUserInfo = (isUpdatePhotoUrl, downloadURL) => {
        let newInfo
        if (isUpdatePhotoUrl) {
            newInfo = {
                nickname: this.state.nickname,
                aboutMe: this.state.aboutMe,
                myLanguage: this.state.myLanguage,
                photoUrl: downloadURL
            }
        } else {
            newInfo = {
                nickname: this.state.nickname,
                aboutMe: this.state.aboutMe,
                myLanguage: this.state.myLanguage,
            }
        }
        myFirestore
            .collection(AppString.NODE_USERS)
            .doc(this.state.id)
            .update(newInfo)
            .then(data => {
                localStorage.setItem(AppString.NICKNAME, this.state.nickname)
                localStorage.setItem(AppString.ABOUT_ME, this.state.aboutMe)
                localStorage.setItem(AppString.MY_LANGUAGE, this.state.myLanguage)
                if (isUpdatePhotoUrl) {
                    localStorage.setItem(AppString.PHOTO_URL, downloadURL)
                }
                this.setState({isLoading: false})
                this.props.showToast(1, 'Update info success')
            })
    }

    render() {
        return (
            <div className="root">
                <Header
                    showToast={this.props.showToast}
                    history={this.props.history}
                />

                <img className="avatar" alt="Avatar" src={this.state.photoUrl}/>

                <div className="viewWrapInputFile">
                    <img
                        className="imgInputFile"
                        alt="icon gallery"
                        src={images.ic_input_file}
                        onClick={() => this.refInput.click()}
                    />
                    <input
                        ref={el => {
                            this.refInput = el
                        }}
                        accept="image/*"
                        className="viewInputFile"
                        type="file"
                        onChange={this.onChangeAvatar}
                    />
                </div>

                <span className="textLabel">Nickname:</span>
                <input
                    className="textInput"
                    value={this.state.nickname ? this.state.nickname : ''}
                    placeholder="Your nickname..."
                    onChange={this.onChangeNickname}
                />
                <span className="textLabel">About me:</span>
                <input
                    className="textInput"
                    value={this.state.aboutMe ? this.state.aboutMe : ''}
                    placeholder="Tell about yourself..."
                    onChange={this.onChangeAboutMe}
                />

                <span className="textLabel">Language:</span>
                <div>
                    {/* iterate through language options to create a select box */}
                    <select
                        className="select-css"
                        value={this.state.myLanguage}
                        onChange={this.onChangeMyLanguage}
                    >
                        {this.state.languages.map(lang => (
                            <option key={lang.code} value={lang.code}>
                            {lang.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button className="btnUpdate" onClick={this.uploadAvatar}>
                    Update
                </button>

                {this.state.isLoading || this.state.languages.length === 0 ? (
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
}

export default withRouter(Profile)
