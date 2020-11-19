import React, {useState} from 'react'
import {withRouter} from 'react-router-dom'
import {myFirebase} from '../../Config/MyFirebase'
import images from '../Themes/Images'
import { useHistory } from "react-router-dom";
import './Header.css'
import {AppString} from './../Const'

function Header(props) {
    const [isOpenDialogConfirmLogout, setOpenDialogConfimLogOut] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const [login, setLogin] = useState(props.login ? true : false)
    const history = useHistory();

    const currentUserAvatar = localStorage.getItem(AppString.PHOTO_URL)

    const onLogoutClick = () => {
        setOpenDialogConfimLogOut(true)
    }

    const doLogout = () => {
        setLoading(true)
        myFirebase
        .auth()
        .signOut()
        .then(() => {
            setLoading(false)
            localStorage.clear()
            history.push('/')
        })
        .catch(function (err) {
            setLoading(false)
        })
    }

    const hideDialogConfirmLogout = () => {
        setOpenDialogConfimLogOut(false)
    }

    const onMessageClick = () => {
        history.push('/main')
    }

    const onCrewClick = () => {
        history.push('/crew')
    }

    const onProfileClick = () => {
        history.push('profile')
    }

    const renderDialogConfirmLogout = () => {
        return (
                <div>
                    <div className="viewWrapTextDialogConfirmLogout">
                        <span className="titleDialogConfirmLogout">Are you ready to logout?</span>
                    </div>
                    <div className="viewWrapButtonDialogConfirmLogout">
                        <button className="btnYes" onClick={doLogout}>
                            Yes
                        </button>
                        <button className="btnNo" onClick={hideDialogConfirmLogout}>
                            Cancel
                        </button>
                    </div>
                </div>
        )
    }

    if (props.login) {
        return (
            <div className="header">
                <img
                    className="parrotCenter"
                    alt="Parley Logo"
                    src={images.parrot}
                />
                <span className="textCenter">Parley</span>
            </div>
        )
    } else {
        return (
                <div>
                    {/* Header */}
                    <div className="header">
                        <img
                            className="parrot"
                            alt="Parley Logo"
                            src={images.parrot}
                        />
                        <span className="text">Parley</span>
                        <img
                            className="icon"
                            alt="An icon logout"
                            src={images.ic_logout}
                            onClick={onLogoutClick}
                        />
                        <img
                            className="profile"
                            alt="An icon default avatar"
                            src={currentUserAvatar}
                            onClick={onProfileClick}
                        />
                        <img
                            className="icon"
                            alt="An icon crew"
                            src={images.ic_crew}
                            onClick={onCrewClick}
                        />
                        <img
                            className="icon"
                            alt="An icon message"
                            src={images.ic_message}
                            onClick={onMessageClick}
                        />
                    </div>

                    {/* Dialog confirm */}
                    {isOpenDialogConfirmLogout ? (
                        <div className="viewCoverScreen">
                            {renderDialogConfirmLogout()}
                        </div>
                    ) : null}
                </div>
        )
    }

}

export default withRouter(Header)
