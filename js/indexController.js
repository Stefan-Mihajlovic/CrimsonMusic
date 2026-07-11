const authGateway = document.getElementById('authGateway');
const authViews = Array.from(document.querySelectorAll('[data-auth-view]'));
const appBodyHolder = document.querySelector('.bodyHolder');
let authViewTransitionTimer;

authGateway?.addEventListener('scroll', () => {
    if(authGateway.scrollTop !== 0){
        authGateway.scrollTop = 0;
    }
}, {passive: true});

function setAuthView(viewName, animate = true){
    const nextView = authViews.find((view) => view.dataset.authView === viewName) || authViews[0];
    const currentView = authViews.find((view) => view.classList.contains('isActive') && !view.hidden);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isFormToFormTransition = currentView?.dataset.authView !== 'welcome' && nextView.dataset.authView !== 'welcome';

    if(currentView === nextView){
        return;
    }

    window.clearTimeout(authViewTransitionTimer);
    authGateway?.classList.toggle('authFormSwitch', Boolean(animate && !reduceMotion && isFormToFormTransition));
    authViews.forEach((view) => {
        if(view !== currentView && view !== nextView){
            view.hidden = true;
            view.classList.remove('isActive', 'isEntering', 'isLeaving');
        }
    });

    nextView.hidden = false;
    nextView.classList.remove('isActive', 'isLeaving');
    currentView?.classList.remove('isEntering');

    if(!animate || reduceMotion || !currentView){
        authGateway?.classList.remove('authFormSwitch');
        currentView?.classList.remove('isActive', 'isLeaving');
        if(currentView){
            currentView.hidden = true;
        }
        nextView.classList.remove('isEntering', 'isLeaving');
        nextView.classList.add('isActive');
    }else{
        authGateway.dataset.authFrom = currentView.dataset.authView;
        authGateway.dataset.authTo = nextView.dataset.authView;
        nextView.classList.add('isEntering');
        currentView.classList.add('isLeaving');
        currentView.classList.remove('isActive');

        void nextView.offsetWidth;
        nextView.classList.add('isActive');
        nextView.classList.remove('isEntering');

        authViewTransitionTimer = window.setTimeout(() => {
            currentView.hidden = true;
            currentView.classList.remove('isLeaving');
            authGateway.classList.remove('authFormSwitch');
            delete authGateway.dataset.authFrom;
            delete authGateway.dataset.authTo;
        }, 780);
    }

    authViews.filter((view) => view !== nextView).forEach((view) => {
        view.querySelectorAll('.authInputError').forEach((input) => input.classList.remove('authInputError'));
    });
    if(authGateway){
        authGateway.scrollTop = 0;
        requestAnimationFrame(() => {
            authGateway.scrollTop = 0;
        });
    }
}

function setAuthGatewayVisible(visible, viewName = 'welcome'){
    if(!authGateway){
        return;
    }
    document.body.classList.toggle('authLocked', visible);
    authGateway.classList.toggle('authGatewayHidden', !visible);
    authGateway.setAttribute('aria-hidden', visible ? 'false' : 'true');
    if(appBodyHolder){
        appBodyHolder.inert = visible;
        appBodyHolder.setAttribute('aria-hidden', visible ? 'true' : 'false');
    }
    if(visible){
        setAuthView(viewName, false);
    }
}

function setAuthInlineMessage(viewName, message = '', type = 'error'){
    const view = authViews.find((item) => item.dataset.authView === viewName);
    const messageElement = view?.querySelector('[data-auth-message]');
    if(!messageElement){
        return;
    }
    messageElement.textContent = message;
    messageElement.classList.toggle('isVisible', Boolean(message));
    messageElement.classList.toggle('isSuccess', type === 'success');
}

document.querySelectorAll('[data-auth-target]').forEach((button) => {
    button.addEventListener('click', () => setAuthView(button.dataset.authTarget));
});

const noticeTypeDetails = {
    error: {title: 'Something went wrong', icon: 'fa-solid fa-circle-exclamation'},
    success: {title: 'All set', icon: 'fa-solid fa-circle-check'},
    warning: {title: 'Heads up', icon: 'fa-solid fa-triangle-exclamation'},
    info: {title: 'Crimson Music', icon: 'fa-solid fa-bell'}
};

function inferCrimsonNoticeType(message){
    const normalized = String(message || '').toLowerCase();
    if(/success|welcome|submitted|saved|created|added|thank/.test(normalized)){
        return 'success';
    }
    if(/warning|too short|too large|under 3mb|empty|valid|choose/.test(normalized)){
        return 'warning';
    }
    if(/error|failed|not found|already exists|wrong|unable|invalid/.test(normalized)){
        return 'error';
    }
    return 'info';
}

function showCrimsonNotice(message, type = 'auto', options = {}){
    const stack = document.getElementById('crimsonNoticeStack');
    if(!stack){
        return;
    }
    const resolvedType = type === 'auto' ? inferCrimsonNoticeType(message) : type;
    const details = noticeTypeDetails[resolvedType] || noticeTypeDetails.info;
    const duration = Math.max(1800, Number(options.duration) || 4400);
    const notice = document.createElement('article');
    notice.className = 'crimsonNotice';
    notice.dataset.type = resolvedType;
    notice.style.setProperty('--notice-duration', `${duration}ms`);

    const icon = document.createElement('div');
    icon.className = 'crimsonNoticeIcon';
    icon.innerHTML = `<i class="${details.icon}"></i>`;
    const copy = document.createElement('div');
    copy.className = 'crimsonNoticeCopy';
    const title = document.createElement('h4');
    title.textContent = options.title || details.title;
    const body = document.createElement('p');
    body.textContent = String(message || '');
    copy.append(title, body);
    const close = document.createElement('button');
    close.className = 'crimsonNoticeClose';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close notification');
    close.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    const progress = document.createElement('span');
    progress.className = 'crimsonNoticeProgress';
    notice.append(icon, copy, close, progress);
    stack.prepend(notice);
    while(stack.children.length > 3){
        stack.lastElementChild.remove();
    }
    let removed = false;
    const removeNotice = () => {
        if(removed){
            return;
        }
        removed = true;
        notice.classList.add('isLeaving');
        setTimeout(() => notice.remove(), 260);
    };
    close.addEventListener('click', removeNotice);
    setTimeout(removeNotice, duration);
    return notice;
}

window.setAuthView = setAuthView;
window.setAuthGatewayVisible = setAuthGatewayVisible;
window.setAuthInlineMessage = setAuthInlineMessage;
window.showCrimsonNotice = showCrimsonNotice;
window.alert = (message) => showCrimsonNotice(message, 'auto');
setAuthGatewayVisible(true, 'welcome');

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js';
import { getDatabase, ref, set, child, get, update, remove, onValue, query, orderByChild, equalTo } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js';
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';

// Firebase Config with all IDs
const firebaseConfig = {
    apiKey: "AIzaSyBtHlJGvOX-dNiyWWUUzheaSl21fD3-WBA",
    authDomain: "crimsonmusic-b97d9.firebaseapp.com",
    projectId: "crimsonmusic-b97d9",
    storageBucket: "crimsonmusic-b97d9.appspot.com",
    messagingSenderId: "181983859666",
    appId: "1:181983859666:web:9afcaab406d031dd092e0b",
    measurementId: "G-V7HPY7PHBR"
};

// ----- FIREBASE INIT
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });
const auth = getAuth(app);

const realdb = getDatabase();

function getRecordImage(record, baseField, size = "large", fallback = ""){
    if(!record){
        return fallback;
    }

    const suffix = size === "small" ? "Small" : size === "original" ? "Original" : "Large";
    return record[`${baseField}${suffix}`] || record[baseField] || record[`${baseField}Original`] || fallback;
}

function getSongImage(record, size = "large"){
    return getRecordImage(record, "ImgURL", size, "images/defaultSong.webp");
}

function getArtistImage(record, size = "large"){
    return getRecordImage(record, "ImageURL", size, "images/defaultArtist.webp");
}

function getArtistAboutImage(record, size = "large"){
    return getRecordImage(record, "AboutBanner", size, getArtistImage(record, size));
}

function getPlaylistImage(record, size = "large"){
    return getRecordImage(record, "Banner", size, "images/defaultPlaylist.webp");
}

function getCategoryImage(record, size = "large"){
    return getRecordImage(record, "Banner", size, "images/defaultPlaylist.webp");
}

function encodeContextPayload(payload){
    return encodeURIComponent(JSON.stringify(payload));
}

function skeletonMarkup(type = "song", count = 3){
    if(type === "category"){
        const rowCount = Math.ceil(count / 2);
        return Array.from({length: rowCount}, (_, rowIndex) => `
            <li class="catItems skeletonCategoryRow" style="--cat-row-index:${rowIndex}">
                <div class="skeletonItem skeletonCategoryCard"><span></span></div>
                <div class="skeletonItem skeletonCategoryCard"><span></span></div>
            </li>`).join("");
    }

    return Array.from({length: count}, (_, index) => {
        if(type === "artist"){
            return `<li class="skeletonItem skeletonArtist" style="--skeleton-index:${index}"><span class="skeletonArtwork"></span><span class="skeletonLine skeletonLineShort"></span></li>`;
        }
        if(type === "playlist"){
            return `<li class="skeletonItem skeletonPlaylist" style="--skeleton-index:${index}"><span class="skeletonArtwork"></span><span class="skeletonLine"></span><span class="skeletonLine skeletonLineShort"></span></li>`;
        }
        return `<li class="skeletonItem skeletonSong" style="--skeleton-index:${index}"><span class="skeletonArtwork"></span><span class="skeletonCopy"><span class="skeletonLine"></span><span class="skeletonLine skeletonLineShort"></span></span><span class="skeletonAction"></span></li>`;
    }).join("");
}

function showSkeleton(container, type = "song", count = 3, append = false){
    if(!container){
        return;
    }
    container.setAttribute("aria-busy", "true");
    const markup = skeletonMarkup(type, count);
    if(append){
        container.insertAdjacentHTML("beforeend", markup);
    }else{
        container.innerHTML = markup;
    }
}

function clearSkeleton(container){
    if(!container){
        return;
    }
    container.querySelectorAll(".skeletonItem, .skeletonCategoryRow").forEach((item) => item.remove());
    container.setAttribute("aria-busy", "false");
}

function appendLoadedMarkup(container, markup){
    clearSkeleton(container);
    container.insertAdjacentHTML("beforeend", markup);
}

function emptyStateMarkup(message){
    return `<li class="contentEmptyState"><i class="fa-regular fa-face-smile"></i><span>${message}</span></li>`;
}

window.crimsonGetSongById = async function(songId){
    const dbRef = ref(realdb);
    const snapshot = await get(child(dbRef, "Songs/"+songId));

    if(!snapshot.exists()){
        return null;
    }

    return {
        songURL: snapshot.val().SongURL,
        title: snapshot.val().SongName,
        creator: snapshot.val().Creator,
        image: getSongImage(snapshot.val(), "large"),
        imageSmall: getSongImage(snapshot.val(), "small"),
        color: snapshot.val().Color
    };
}

const relatedSongCache = new Map();

function getRelatedTokens(record){
    return String(record?.Categories || record?.Category || record?.Genre || "")
        .toLowerCase()
        .split(/[,|/{}]+/)
        .map((token) => token.trim())
        .filter(Boolean);
}

window.crimsonGetRelatedSongs = async function(currentSong, limit = 8){
    const currentId = String(currentSong?.id || "");
    if(!currentId){
        return [];
    }
    if(relatedSongCache.has(currentId)){
        return relatedSongCache.get(currentId);
    }

    const request = get(child(ref(realdb), "Songs")).then((snapshot) => {
        const records = snapshot.val() || {};
        const currentRecord = records[currentId] || {};
        const currentCreator = String(currentRecord.Creator || currentSong.creator || "").trim().toLowerCase();
        const currentTokens = new Set(getRelatedTokens(currentRecord));

        return Object.entries(records)
            .filter(([id, record]) => id !== currentId && record?.SongURL && record?.SongName)
            .map(([id, record]) => {
                const creator = String(record.Creator || "").trim().toLowerCase();
                const sharedTokens = getRelatedTokens(record).filter((token) => currentTokens.has(token));
                const sameCreator = !!currentCreator && creator === currentCreator;
                const score = (sameCreator ? 1000 : 0) + (sharedTokens.length * 120) + (Number(id) % 97) / 100;

                return {
                    id: String(id),
                    url: record.SongURL,
                    title: record.SongName,
                    creator: record.Creator || "Unknown artist",
                    image: getSongImage(record, "large"),
                    imageSmall: getSongImage(record, "small"),
                    color: record.Color || "#1c1625",
                    reason: sameCreator ? "Artist" : (sharedTokens.length ? "Similar vibe" : "For you"),
                    score
                };
            })
            .sort((first, second) => second.score - first.score)
            .slice(0, limit);
    }).catch((error) => {
        relatedSongCache.delete(currentId);
        throw error;
    });

    relatedSongCache.set(currentId, request);
    return request;
}

async function playSongFromContext(songId, sourceName){
    const song = await window.crimsonGetSongById(songId);
    if(!song || typeof window.playerSelectedSong !== "function"){
        return false;
    }

    window.playerSelectedSong(
        song.songURL,
        song.title,
        song.creator,
        song.image,
        song.color,
        sourceName,
        0,
        String(songId)
    );
    return true;
}

window.crimsonPlayPlaylistFromContext = async function(context){
    if(context?.favorites){
        if(currentUser == undefined){
            openLoginPopup();
            return false;
        }
        const snapshot = await get(child(ref(realdb), "Users/"+currentUser.Username));
        const firstLikedSong = String(snapshot.val()?.LikedSongs || "").split(',').filter(Boolean).reverse()[0];
        return firstLikedSong ? playSongFromContext(firstLikedSong, "Favorites") : false;
    }

    const firstSong = String(context?.songs || "").split(',').find(Boolean);
    return firstSong ? playSongFromContext(firstSong, context?.name || "Playlist") : false;
}

window.crimsonPlayArtistFromContext = async function(context){
    const snapshot = await get(child(ref(realdb), "Songs"));
    const artistName = String(context?.name || "").toLowerCase();
    const match = Object.entries(snapshot.val() || {}).find(([, song]) =>
        String(song?.Creator || "").toLowerCase().includes(artistName)
    );

    return match ? playSongFromContext(match[0], context?.name || "Artist") : false;
}

window.crimsonPlayCategoryFromContext = async function(context){
    const snapshot = await get(child(ref(realdb), "Songs"));
    const categoryName = String(context?.name || "").toLowerCase();
    const match = Object.entries(snapshot.val() || {}).find(([, song]) =>
        String(song?.Categories || "").toLowerCase().includes(categoryName)
    );

    return match ? playSongFromContext(match[0], context?.name || "Category") : false;
}

window.crimsonLoadLyricsIntoPlayerPopup = async function(songId){
    const lyricsBody = document.getElementById("queueLyricsBody");
    if(!lyricsBody){
        return;
    }

    const requestedId = String(songId);
    lyricsBody.dataset.lyricsSongId = requestedId;
    lyricsBody.innerHTML = "<p class=\"playerPopupLoading\">Loading lyrics...</p>";

    const dbRef = ref(realdb);
    const snapshot = await get(child(dbRef, "Songs/"+songId));

    if(lyricsBody.dataset.lyricsSongId !== requestedId){
        return;
    }

    if(snapshot.exists() && snapshot.val().Lyrics){
        const lines = String(snapshot.val().Lyrics)
            .replace(/<br\s*\/?\s*>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .split(/\r?\n/);
        const lyricFragment = document.createDocumentFragment();
        lines.forEach((line, index) => {
            const lyricLine = document.createElement("p");
            lyricLine.className = "playerPopupStaggerLine";
            lyricLine.style.setProperty("--player-popup-item-index", index);
            lyricLine.textContent = line || " ";
            lyricFragment.appendChild(lyricLine);
        });
        lyricsBody.replaceChildren(lyricFragment);
    }else{
        lyricsBody.innerHTML = "<p class=\"playerPopupLoading\">No lyrics available for this song.</p>";
    }
    lyricsBody.scrollTo(0, 0);
}

function loadAppNumbers(){
    return new Promise(resolve => {
        onValue(ref(realdb, 'Songs/'), (snapshot) => {
            const data = snapshot.val();
            brojPesama = data.length - 1;
            window.crimsonSongCount = brojPesama;

            onValue(ref(realdb, 'Artists/'), (snapshot) => {
                const data = snapshot.val();
                brojArtista = data.length - 1;

                onValue(ref(realdb, 'PublicPlaylists/'), (snapshot) => {
                    const data = snapshot.val();
                    brojPlejlista = data.length - 1;

                    resolve(true);
                })
            })
        });
    })
}

const username = document.getElementById('username');
const email = document.getElementById('email');
const password = document.getElementById('password');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const authLoginForm = document.getElementById('authLoginForm');
const authRegisterForm = document.getElementById('authRegisterForm');
const authLoginIdentifier = document.getElementById('authLoginIdentifier');
const authLoginPassword = document.getElementById('authLoginPassword');
const authRegisterUsername = document.getElementById('authRegisterUsername');
const authRegisterEmail = document.getElementById('authRegisterEmail');
const authRegisterPassword = document.getElementById('authRegisterPassword');
const googleAuthButtons = Array.from(document.querySelectorAll('[data-google-auth]'));

let accountNames = document.getElementsByName('accountName');
let accountEmails = document.getElementsByName('accountEmail');
let accountPhotos = document.getElementsByName('profilePhoto');
const profilePhotoUpload = document.getElementById('profilePhotoUpload');
const googleProfilePhotoOption = document.getElementById('googleProfilePhotoOption');
let accountUsername;
let accountEmail;
let profilePhoto;
export let accountTheme = "Dark";

let loggedIn = false;

let currentUser;
let selectedProfilePhotoFile = null;

function isEmptyOrSpaces(str){
    return str == null || str.match(/^ *$/) !== null;
}

function getProfilePhotoSrc(photoValue){
    if(!photoValue){
        return "images/profiles/1.png";
    }
    photoValue = String(photoValue);
    if(photoValue.startsWith("http") || photoValue.startsWith("blob:") || photoValue.startsWith("data:") || photoValue.includes("/")){
        return photoValue;
    }
    return `images/profiles/${photoValue}.png`;
}

function setAccountPhotoSrc(photoValue){
    const photoSrc = getProfilePhotoSrc(photoValue);
    accountPhotos.forEach((photo) => {
        photo.src = photoSrc;
    });

    const editablePhoto = document.querySelector('.accPhotoWrapper img');
    if(editablePhoto){
        editablePhoto.setAttribute('data-photo-url', photoValue || "1");
        editablePhoto.removeAttribute('data-photo-id');
        editablePhoto.removeAttribute('data-photo-upload');
    }
}

function syncGoogleProfilePhotoOption(user = currentUser){
    if(!googleProfilePhotoOption){
        return;
    }

    const googlePhotoURL = user?.GooglePhotoURL || "";
    googleProfilePhotoOption.classList.toggle('displayNone', !googlePhotoURL);
    googleProfilePhotoOption.dataset.photoUrl = googlePhotoURL;
    const preview = googleProfilePhotoOption.querySelector('img');
    if(preview && googlePhotoURL){
        preview.src = googlePhotoURL;
    }
}

googleProfilePhotoOption?.addEventListener('click', () => {
    const googlePhotoURL = googleProfilePhotoOption.dataset.photoUrl;
    const editablePhoto = document.querySelector('.accPhotoWrapper img');
    if(!googlePhotoURL || !editablePhoto){
        return;
    }

    editablePhoto.src = googlePhotoURL;
    editablePhoto.setAttribute('data-photo-url', googlePhotoURL);
    editablePhoto.removeAttribute('data-photo-id');
    editablePhoto.removeAttribute('data-photo-upload');
    selectedProfilePhotoFile = null;
    if(profilePhotoUpload){
        profilePhotoUpload.value = "";
    }
    document.querySelector('.photoPicker')?.classList.add('displayNone');
    document.querySelector('.presetPhotoGrid')?.classList.add('displayNone');
    window.dispatchEvent(new CustomEvent('profilePhotoPickerClosed'));
    window.showCrimsonNotice?.('Google profile photo selected. Tap Save to apply it.', 'info');
});

function getSafeFileName(file){
    const extension = GetFileExt(file).toLowerCase();
    const baseName = GetFileName(file).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40) || "profile-photo";
    return `${baseName}-${Date.now()}${extension}`;
}

function uploadProfilePhoto(file){
    return new Promise(resolve => {
        if(!file){
            resolve(null);
            return;
        }

        const storage = getStorage();
        const storageRef = sRef(storage, `ProfilePhotos/${currentUser.Username}/${getSafeFileName(file)}`);
        const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

        uploadTask.on('state-changed', () => {},
        (error) => {
            alert("Profile photo failed to upload: " + error.message);
            resolve(null);
        },
        () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                resolve(downloadURL);
            });
        });
    });
}

if(profilePhotoUpload){
    profilePhotoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file){
            return;
        }
        if(!file.type.startsWith("image/")){
            alert("Please choose an image file.");
            profilePhotoUpload.value = "";
            return;
        }
        if(file.size > 3 * 1024 * 1024){
            alert("Profile photo has to be under 3MB.");
            profilePhotoUpload.value = "";
            return;
        }

        selectedProfilePhotoFile = file;
        const previewUrl = URL.createObjectURL(file);
        const editablePhoto = document.querySelector('.accPhotoWrapper img');
        editablePhoto.src = previewUrl;
        editablePhoto.setAttribute('data-photo-upload', 'true');
        editablePhoto.removeAttribute('data-photo-id');
        editablePhoto.removeAttribute('data-photo-url');
        document.querySelector('.photoPicker').classList.add('displayNone');
        document.querySelector('.presetPhotoGrid').classList.add('displayNone');
        window.dispatchEvent(new CustomEvent('profilePhotoPickerClosed'));
    });

    window.addEventListener('profilePresetSelected', () => {
        selectedProfilePhotoFile = null;
        profilePhotoUpload.value = "";
    });
}

function setAuthFormMessage(viewName, message = "", type = "error", input = null){
    window.setAuthInlineMessage?.(viewName, message, type);
    document.querySelectorAll(`[data-auth-view="${viewName}"] .authInputError`).forEach((item) => item.classList.remove('authInputError'));
    input?.classList.add('authInputError');
    if(message && type === "error"){
        window.showCrimsonNotice?.(message, "error", {title: "Unable to continue"});
    }
}

function setAuthFormBusy(form, isBusy){
    if(!form){
        return;
    }
    form.querySelectorAll('button, input').forEach((control) => {
        control.disabled = isBusy;
    });
    const submit = form.querySelector('[type="submit"]');
    if(submit){
        if(!submit.dataset.defaultLabel){
            submit.dataset.defaultLabel = submit.textContent;
        }
        submit.textContent = isBusy ? "Just a moment..." : submit.dataset.defaultLabel;
    }
}

function validateRegistration(usernameValue, emailValue, passwordValue, viewName = null){
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9]{4,20}$/;

    if(isEmptyOrSpaces(usernameValue)){
        viewName ? setAuthFormMessage(viewName, 'Enter a username.', 'error', authRegisterUsername) : alert('Enter a username.');
        return false;
    }
    if(!usernameRegex.test(usernameValue)){
        viewName ? setAuthFormMessage(viewName, 'Username must be 4–20 letters or numbers.', 'error', authRegisterUsername) : alert('Username must be 4–20 letters or numbers.');
        return false;
    }
    if(!emailRegex.test(emailValue)){
        viewName ? setAuthFormMessage(viewName, 'Enter a valid email address.', 'error', authRegisterEmail) : alert('Enter a valid email address.');
        return false;
    }
    if(!passwordValue || passwordValue.length < 6){
        viewName ? setAuthFormMessage(viewName, 'Password must have at least 6 characters.', 'error', authRegisterPassword) : alert('Password must have at least 6 characters.');
        return false;
    }
    return true;
}

function encryptPassword(passwordValue){
    return CryptoJS.AES.encrypt(passwordValue, passwordValue).toString();
}

function decryptPassword(encryptedPassword, passwordValue){
    if(!encryptedPassword || !passwordValue){
        return "";
    }
    try{
        return CryptoJS.AES.decrypt(encryptedPassword, passwordValue).toString(CryptoJS.enc.Utf8);
    }catch(error){
        return "";
    }
}

// ----- REGISTER USER

async function registerAccount(usernameValue, emailValue, passwordValue, viewName = null){
    usernameValue = String(usernameValue || '').trim();
    emailValue = String(emailValue || '').trim().toLowerCase();

    if(!validateRegistration(usernameValue, emailValue, passwordValue, viewName)){
        return;
    }

    const form = viewName ? authRegisterForm : null;
    setAuthFormBusy(form, true);
    try{
        const dbRef = ref(realdb);
        const snapshot = await get(child(dbRef, "Users/"+usernameValue));
        if(snapshot.exists()){
            viewName ? setAuthFormMessage(viewName, 'That username is already taken.', 'error', authRegisterUsername) : alert('Account already exists!');
            return;
        }

        const existingEmailSnapshot = await get(query(ref(realdb, "Users"), orderByChild("Email"), equalTo(emailValue)));
        if(existingEmailSnapshot.exists()){
            viewName ? setAuthFormMessage(viewName, 'An account already uses this email.', 'error', authRegisterEmail) : alert('An account already uses this email.');
            return;
        }

        const newUser = createDefaultUser(usernameValue, emailValue);
        newUser.Password = encryptPassword(passwordValue);
        await set(ref(realdb, "Users/"+usernameValue), newUser);
        window.showCrimsonNotice?.(`Welcome to Crimson, ${usernameValue}!`, 'success');
        setAuthFormMessage(viewName || 'register', '', 'success');
        loginUser(newUser);
        LoadUserPlaylists();
        LoadLikedPlaylists();
        LoadUserFArtists();
    }catch(error){
        const message = "We couldn't create your account. Please try again.";
        viewName ? setAuthFormMessage(viewName, message) : alert(message);
        console.error(error);
    }finally{
        setAuthFormBusy(form, false);
    }
}

function RegisterUser(){
    return registerAccount(username.value, email.value, password.value);
}

function createDefaultUser(usernameValue, emailValue, authUser = null){
    return {
        Username: usernameValue,
        Email: emailValue,
        Password: "",
        Playlists: "",
        ProfilePhoto: "1",
        GooglePhotoURL: authUser?.photoURL || "",
        LikedSongs: "",
        AppTheme: "Dark",
        FollowedArtists: "",
        LikedPlaylists: "",
        AuthProvider: authUser ? "google" : "password",
        GoogleUid: authUser ? authUser.uid : ""
    };
}

// Call the register user on click
registerBtn?.addEventListener('click', RegisterUser);
loginBtn?.addEventListener('click', AuthenticateUser);
googleLoginBtn?.addEventListener('click', SignInWithGoogle);
googleAuthButtons.forEach((button) => button.addEventListener('click', SignInWithGoogle));

authRegisterForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    registerAccount(authRegisterUsername.value, authRegisterEmail.value, authRegisterPassword.value, 'register');
});

authLoginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    authenticateAccount(authLoginIdentifier.value, authLoginPassword.value, 'login');
});

// ----- AUTHENTICATE USER

async function findPasswordUser(identifier){
    identifier = String(identifier || '').trim();
    if(!identifier){
        return null;
    }

    if(!identifier.includes('@')){
        const directSnapshot = await get(child(ref(realdb), "Users/"+identifier));
        return directSnapshot.exists() ? directSnapshot.val() : null;
    }

    const emailSnapshot = await get(query(ref(realdb, "Users"), orderByChild("Email"), equalTo(identifier.toLowerCase())));
    return getFirstSnapshotValue(emailSnapshot);
}

async function authenticateAccount(identifier, passwordValue, viewName = null){
    identifier = String(identifier || '').trim();
    if(!identifier){
        viewName ? setAuthFormMessage(viewName, 'Enter your email or username.', 'error', authLoginIdentifier) : alert('Enter your username.');
        return;
    }
    if(!passwordValue){
        viewName ? setAuthFormMessage(viewName, 'Enter your password.', 'error', authLoginPassword) : alert('Enter your password.');
        return;
    }

    const form = viewName ? authLoginForm : null;
    setAuthFormBusy(form, true);
    try{
        const user = await findPasswordUser(identifier);
        if(!user){
            const message = 'We couldn’t find that account.';
            viewName ? setAuthFormMessage(viewName, message, 'error', authLoginIdentifier) : alert(message);
            return;
        }

        if(decryptPassword(user.Password, passwordValue) !== passwordValue){
            const message = 'That password doesn’t look right.';
            viewName ? setAuthFormMessage(viewName, message, 'error', authLoginPassword) : alert(message);
            return;
        }

        setAuthFormMessage(viewName || 'login', '', 'success');
        loginUser(user);
        LoadUserPlaylists();
        LoadLikedPlaylists();
        LoadUserFArtists();
        window.showCrimsonNotice?.(`Welcome back, ${user.Username}.`, 'success');
    }catch(error){
        const message = 'Sign in failed. Check your connection and try again.';
        viewName ? setAuthFormMessage(viewName, message) : alert(message);
        console.error(error);
    }finally{
        setAuthFormBusy(form, false);
    }
}

function AuthenticateUser(){
    return authenticateAccount(username.value, password.value);
}

function sanitizeGoogleUsername(authUser){
    const rawName = authUser.displayName || (authUser.email ? authUser.email.split("@")[0] : "crimsonuser");
    const baseName = rawName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 18) || "crimsonuser";
    return baseName.length >= 4 ? baseName : `${baseName}${authUser.uid.slice(0, 4)}`;
}

function getFirstSnapshotValue(snapshot){
    let foundUser = null;
    snapshot.forEach((childSnapshot) => {
        if(!foundUser){
            foundUser = childSnapshot.val();
        }
    });
    return foundUser;
}

async function ensureGoogleUser(authUser){
    const usersRef = ref(realdb, "Users");
    const existingGoogleUserSnapshot = await get(query(usersRef, orderByChild("GoogleUid"), equalTo(authUser.uid)));
    const existingGoogleUser = getFirstSnapshotValue(existingGoogleUserSnapshot);

    if(existingGoogleUser){
        const googleUserPatch = {
            AuthProvider: "google",
            GoogleUid: authUser.uid,
            GooglePhotoURL: authUser.photoURL || existingGoogleUser.GooglePhotoURL || ""
        };
        await update(ref(realdb, "Users/"+existingGoogleUser.Username), googleUserPatch);
        return {...existingGoogleUser, ...googleUserPatch};
    }

    const baseUsername = sanitizeGoogleUsername(authUser);
    let nextUsername = baseUsername;
    let usernameSnapshot = await get(child(ref(realdb), "Users/"+nextUsername));

    if(usernameSnapshot.exists() && usernameSnapshot.val().GoogleUid !== authUser.uid){
        nextUsername = `${baseUsername}${authUser.uid.slice(0, 6)}`;
        usernameSnapshot = await get(child(ref(realdb), "Users/"+nextUsername));
    }

    if(usernameSnapshot.exists()){
        return usernameSnapshot.val();
    }

    const newUser = createDefaultUser(nextUsername, authUser.email || "", authUser);
    await set(ref(realdb, "Users/"+nextUsername), newUser);
    return newUser;
}

async function handleGoogleCredential(authUser){
    const user = await ensureGoogleUser(authUser);
    loginUser(user);
    LoadUserPlaylists();
    LoadLikedPlaylists();
    LoadUserFArtists();
}

async function SignInWithGoogle(){
    googleAuthButtons.forEach((button) => {
        button.disabled = true;
        const label = button.querySelector('span');
        if(label){
            label.dataset.defaultLabel ||= label.textContent;
            label.textContent = 'Connecting...';
        }
    });
    try{
        const result = await signInWithPopup(auth, provider);
        await handleGoogleCredential(result.user);
    }catch(error){
        if(error.code === "auth/popup-blocked"){
            await signInWithRedirect(auth, provider);
            return;
        }
        if(error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request"){
            return;
        }
        window.showCrimsonNotice?.("Google sign in failed. Please try again.", "error");
        console.error(error);
    }finally{
        googleAuthButtons.forEach((button) => {
            button.disabled = false;
            const label = button.querySelector('span');
            if(label?.dataset.defaultLabel){
                label.textContent = label.dataset.defaultLabel;
            }
        });
    }
}

getRedirectResult(auth)
.then((result) => {
    if(result && result.user){
        handleGoogleCredential(result.user);
    }
})
.catch((error) => {
    window.showCrimsonNotice?.("Google sign in failed. Please try again.", "error");
    console.error(error);
});

function reloadUserPhotoAndUsername(){
    const dbRef = ref(realdb);

    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            loginUser(snapshot.val());
        }
    })
}

// ----- LOGIN USER

function loginUser(user){
    currentUser = user;
    localStorage.setItem('keepLoggedIn', 'yes');
    localStorage.setItem('user', JSON.stringify(user));
    accountUsername = user.Username;
    accountEmail = user.Email;
    accountNames.forEach((name) => {
        name.innerHTML = accountUsername;
    });
    accountEmails.forEach((email) => {
        email.innerHTML = accountEmail;
    });
    syncGoogleProfilePhotoOption(user);
    
    let dbRef = ref(realdb);
    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            const latestUser = snapshot.val();
            currentUser = latestUser;
            localStorage.setItem('user', JSON.stringify(latestUser));
            let setProfilePhoto = latestUser.ProfilePhoto || "1";
            setAccountPhotoSrc(setProfilePhoto);
            syncGoogleProfilePhotoOption(latestUser);
        }
    })

    accountTheme = user.AppTheme || "Dark";
    setLoggedInScreen();
}

function getUsername(){
    let keepLoggedIn = localStorage.getItem('keepLoggedIn');

    if(keepLoggedIn === 'yes'){
        currentUser = JSON.parse(localStorage.getItem('user'));
    }
}

// ----- SIGN OUT USER

function SignOutUser(){
    localStorage.removeItem('user');
    localStorage.removeItem('keepLoggedIn');
    accountUsername ="Guest";
    accountEmail ="";
    accountNames.forEach((name) => {
        name.innerHTML = accountUsername;
    });
    accountEmails.forEach((email) => {
        email.innerHTML = accountEmail;
    });
    profilePhoto = "1";
    setAccountPhotoSrc(profilePhoto);
    location.reload();
    return false;
}

let logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', ()=>{
    signOut(auth).then(() => {
        SignOutUser();
        DeLoadUserPlaylists();
        DeLoadLikedPlaylists();
        DeLoadUserFArtists();
    }).catch((error) => {
        // An error happened.
    });
})

// See if user was signed in
async function seeIfUserIsSignedIn(){
    if(currentUser == null || !currentUser.Username){
        setLoggedOutScreen();
        return;
    }

    try{
        const snapshot = await get(child(ref(realdb), "Users/"+currentUser.Username));
        if(snapshot.exists()){
            loginUser(snapshot.val());
            return;
        }
    }catch(error){
        console.error(error);
        window.showCrimsonNotice?.('We could not verify your session. Please sign in again.', 'warning');
    }

    localStorage.removeItem('user');
    localStorage.removeItem('keepLoggedIn');
    currentUser = null;
    setLoggedOutScreen();
}

// Is user signed in check

export function UserSignedIn(){
    if(currentUser != undefined){
        return true;
    }else{
        return false;
    }
}

// ----- Generate a song based on the songID

let songToBePlayed,songTitle,songCreator,imageURL,imageURLSmall,songColor;

let recSongs = document.getElementById("recSongs");

function GenerateOneSong(songName){
    let name = songName;

    let dbRef = ref(realdb);

    return get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songToBePlayed = snapshot.val().SongURL;
            songTitle  = snapshot.val().SongName;
            songCreator = snapshot.val().Creator;
            imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
            songColor = snapshot.val().Color;
            let currentLI =  `<li class="songItem">
                <div class="songInfo">
                    <div class="songVisualizer">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <img onError="noStorage()" src="`+imageURLSmall+`" alt="songBanner">
                    <div class="songText">
                        <h2>`+ songTitle +`</h2>
                        <h3>`+ songCreator +`</h3>
                    </div>
                </div>
                <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','Home',this.parentElement,'`+ name +`');"></div>
                <div class="songBtns">
                    <button onclick="openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
                </div>
            </li>`;
            appendLoadedMarkup(recSongs, currentLI);

            if(recSongs.children.length == 5){
                setTimeout(() => {
                    document.querySelector('.loaderWrapper').classList.add('loaderOff');
                }, 500);
            }
        }
    })
}

function generateSongs(){

    let randomList = [];

    const requests = [];
    for (let i = 0; i < 5; i++) {
        while(true){
            let g = Math.floor(Math.random() * brojPesama) + 1;
            if(!randomList.includes(g)){
                requests.push(GenerateOneSong(g));
                randomList.push(g);
                break;
            }
        }
    }
    return Promise.allSettled(requests).finally(() => clearSkeleton(recSongs));
}

// ----- GENERATE ARTISTS
let artistImage,artistImageSmall,artistFollowers,artistListens,artistAboutImage;
let recArtists = document.getElementsByClassName("recArtists")[0];

function GetArtists(artistName){
    let name = artistName;

    let dbRef = ref(realdb);

    return get(child(dbRef, "Artists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            artistName = snapshot.val().Artist;
            artistImage = getArtistImage(snapshot.val(), "large");
            artistImageSmall = getArtistImage(snapshot.val(), "small");
            artistFollowers = snapshot.val().Followers;
            artistListens = snapshot.val().Listens;
            artistAboutImage = getArtistAboutImage(snapshot.val(), "large");
            let currentImg =  `<li id="song`+ name +`" class="artistItem" data-crimson-context="${encodeContextPayload({type: "artist", id: name, name: artistName, image: artistImage, imageSmall: artistImageSmall, followers: artistFollowers, listens: artistListens, aboutImage: artistAboutImage})}" onclick="openArtistPage(`+ name +`,'`+ artistName +`','`+ artistImage +`','`+ artistFollowers +`','`+ artistListens +`','`+ artistAboutImage +`');">
            <img onload="buttonClickAnim(this.parentElement)" src="`+ artistImageSmall +`" alt="artistImage">
            <h3>`+ artistName +`</h3>
            </li>`;
            appendLoadedMarkup(recArtists, currentImg);
        }
    })
}

function generateArtists(){
    let randomList = [];
    const requests = [];

    for (let i = 0; i < 10; i++) {
        while(true){
            let g = Math.floor(Math.random() * brojArtista) + 1;
            if(!randomList.includes(g)){
                requests.push(GetArtists(g));
                randomList.push(g);
                break;
            }
        }
    }
    return Promise.allSettled(requests).finally(() => clearSkeleton(recArtists));
}

// ----- GENERATE PLAYLISTS
let playlistBanner,playlistBannerSmall,playlistLikes,playlistSongs,playlistArtists,playlistOwners;
let recPlaylists = document.getElementsByClassName("recPlaylists")[0];

function GetPlaylists(playlistName){
    let name = playlistName;

    let dbRef = ref(realdb);

    return get(child(dbRef, "PublicPlaylists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            let currentLi = "";

            playlistName = snapshot.val().Title;
            playlistBanner = getPlaylistImage(snapshot.val(), "large");
            playlistBannerSmall = getPlaylistImage(snapshot.val(), "small");
            playlistLikes = snapshot.val().Likes;
            playlistSongs = snapshot.val().Songs;
            playlistArtists = snapshot.val().Artists;
            playlistOwners = snapshot.val().Owners;

            if(playlistOwners != "..Crimson.."){
                currentLi =  `<li class="playlistItem" data-crimson-context="${encodeContextPayload({type: "publicPlaylist", id: name, name: playlistName, image: playlistBanner, imageSmall: playlistBannerSmall, likes: playlistLikes, songs: playlistSongs || "", artists: playlistArtists || ""})}" onclick="openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                    <img onload="buttonClickAnim(this.parentElement)" src="`+ playlistBannerSmall +`" alt="playlistBanner">
                    <h3>`+ playlistName +`</h3>
                    <h5>`+ playlistArtists +`</h5>
                </li>`;
            }else{
                currentLi =  `<li class="playlistItem" data-crimson-context="${encodeContextPayload({type: "publicPlaylist", id: name, name: playlistName, image: playlistBanner, imageSmall: playlistBannerSmall, likes: playlistLikes, songs: playlistSongs || "", artists: playlistArtists || ""})}" onclick="openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                    <div>
                        <img onload="buttonClickAnim(this.parentElement.parentElement)" src="`+ playlistBannerSmall +`" alt="playlistBanner">
                        <img class="crimsonPlaylistTag" src="../images/CrimsonLogo.png" alt="Crimson Tag"></img>
                    </div>
                    <h3>`+ playlistName +`</h3>
                    <h5>`+ playlistArtists +`</h5>
                </li>`;
            }

            appendLoadedMarkup(recPlaylists, currentLi);
        }
    })
}

function generatePlaylists(){

    let randomList = [];
    const requests = [];

    for (let i = 0; i < 5; i++) {
        while(true){
            let g = Math.floor(Math.random() * brojPlejlista) + 1;
            if(!randomList.includes(g)){
                requests.push(GetPlaylists(g));
                randomList.push(g);
                break;
            }
        }
    }
    return Promise.allSettled(requests).finally(() => clearSkeleton(recPlaylists));
}

// ----- SEARCH

let searchList = document.getElementsByClassName("searchList")[0];
let searchLoadToken = 0;

const searchBtn = document.getElementById("submitSearch");
searchBtn.addEventListener('click', () => {
    const requestToken = ++searchLoadToken;
    
    const searchInput = document.getElementById("searchInput");
    const searchedText = searchInput.value;
    const searchedTextLower = searchedText.toLowerCase();

    const isAllCh = document.getElementById("allInput").checked;
    const isSongsCh = document.getElementById("songsInput").checked;
    const isArtistsCh = document.getElementById("artistsInput").checked;
    const isPlaylistsCh = document.getElementById("playlistsInput").checked;
    const isProfilesCh = document.getElementById("profilesInput").checked;

    searchList.innerHTML = "";
    searchList.classList.add("searchListOpen");

    if(searchedTextLower != ""){
        showSkeleton(searchList, "song", 5);
        window.crimsonSaveSearchHistory?.("search", searchedText);
        const searchRequests = [];

        if(isAllCh || isSongsCh){
            for (let i = 1; i <= brojPesama; i++) {
                searchRequests.push(findSearchedSong(i,searchedTextLower,requestToken));
            }
        }
    
        if(isAllCh || isArtistsCh){
            for (let i = 1; i <= brojArtista; i++) {
                searchRequests.push(findSearchedArtist(i,searchedTextLower,requestToken));
            }
        }

        if(isAllCh || isPlaylistsCh){
            for (let i = 1; i <= brojPlejlista; i++) {
                searchRequests.push(findSearchedPlaylist(i,searchedTextLower,requestToken));
            }
        }
        Promise.allSettled(searchRequests).then(() => {
            if(requestToken !== searchLoadToken){
                return;
            }
            clearSkeleton(searchList);
            if(searchList.children.length === 0){
                searchList.innerHTML = emptyStateMarkup("No matching music found");
            }
        });
    }else{
        clearSkeleton(searchList);
        searchList.classList.remove("searchListOpen");
    }
});

function findSearchedSong(songName, inputText, requestToken){
    let name = songName;

    let dbRef = ref(realdb);

    return get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(requestToken !== searchLoadToken){
            return;
        }
        if(snapshot.exists()){
            songTitle  = snapshot.val().SongName;
            if(songTitle.toLowerCase().includes(inputText.toLowerCase())){
                songToBePlayed = snapshot.val().SongURL;
                songCreator = snapshot.val().Creator;
                imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem songItemSearch" onclick="clickEffect(this)">
                    <div class="songInfo">
                        <div class="songVisualizer">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <img src="`+imageURLSmall+`" alt="songBanner">
                        <div class="songText">
                            <h2>`+ songTitle +`</h2>
                            <h3>`+ songCreator +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','Search',this.parentElement,'`+ name +`');"></div>
                    <div class="songBtns">
                        <button onclick="openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
                    </div>
                    </li>`;
                appendLoadedMarkup(searchList, currentLI);
            }
        }
    })
}

function findSearchedArtist(artistName, inputText, requestToken){
    let name = artistName;

    let dbRef = ref(realdb);

    return get(child(dbRef, "Artists/"+name)).then((snapshot)=>{
        if(requestToken !== searchLoadToken){
            return;
        }
        if(snapshot.exists()){
            artistName = snapshot.val().Artist;
            let artistTerms = snapshot.val().ArtistSearchTerms || "";
            if(artistName.toLowerCase().includes(inputText) || artistTerms.toLowerCase().includes(inputText)){
                artistImage = getArtistImage(snapshot.val(), "large");
                artistImageSmall = getArtistImage(snapshot.val(), "small");
                artistFollowers = snapshot.val().Followers;
                artistListens = snapshot.val().Listens;
                artistAboutImage = getArtistAboutImage(snapshot.val(), "large");
                let currentLi = `<li class="artistItemSearch" data-crimson-context="${encodeContextPayload({type: "artist", id: name, name: artistName, image: artistImage, imageSmall: artistImageSmall, followers: artistFollowers, listens: artistListens, aboutImage: artistAboutImage})}" onclick="clickEffect(this); openArtistPage(`+ name +`,'`+ artistName +`','`+ artistImage +`','`+ artistFollowers +`','`+ artistListens +`','`+ artistAboutImage +`'); clickEffect(this);">
                                    <div>
                                        <img  src="`+ artistImageSmall +`" alt="artistImage">
                                        <h3>`+ artistName +`</h3>
                                    </div>
                                    <i class="fa-solid fa-circle-right"></i>
                                </li>`;
                appendLoadedMarkup(searchList, currentLi);
            }
        }
    })
}

function findSearchedPlaylist(playlistName, inputText, requestToken){
    let name = playlistName;

    let dbRef = ref(realdb);

    return get(child(dbRef, "PublicPlaylists/"+name)).then((snapshot)=>{
        if(requestToken !== searchLoadToken){
            return;
        }
        if(snapshot.exists()){
            playlistName = snapshot.val().Title;
            if(playlistName.toLowerCase().includes(inputText.toLowerCase())){
                playlistBanner = getPlaylistImage(snapshot.val(), "large");
            playlistBannerSmall = getPlaylistImage(snapshot.val(), "small");
                playlistLikes = snapshot.val().Likes;
                playlistSongs = snapshot.val().Songs;
                playlistArtists = snapshot.val().Artists;
                let currentLi =  `<li class="playlistItemSearch" data-crimson-context="${encodeContextPayload({type: "publicPlaylist", id: name, name: playlistName, image: playlistBanner, imageSmall: playlistBannerSmall, likes: playlistLikes, songs: playlistSongs || "", artists: playlistArtists || ""})}" onclick="clickEffect(this); openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                    <div class="playlistItemHolder">
                        <img  src="`+ playlistBannerSmall +`" alt="playlistBanner">
                        <div>
                            <h3>`+ playlistName +`</h3>
                            <h5>`+ playlistArtists +`</h5>
                        </div>
                    </div>
                    <i class="fa-solid fa-circle-right"></i>
                </li>`;
                appendLoadedMarkup(searchList, currentLi);
            }
        }
    })
}

// ----- GENERATE CATEGORIES

let categoriesList = document.getElementsByClassName("categories")[0];

function renderCategoryCard(record){
    if(!record){
        return "";
    }

    const categoryName = record.Name || "Category";
    const categoryColor = record.Color || "#3c2368";
    const categoryBanner = getCategoryImage(record, "large");
    const categoryThumbnail = getCategoryImage(record, "small");
    return `<button class="catItem" type="button" data-crimson-context="${encodeContextPayload({type: "category", name: categoryName, color: categoryColor, image: categoryBanner, category: true})}" style="--category-color: ${categoryColor}" onclick="clickEffect(this); openCategoryPage('${categoryName}', '${categoryColor}', '${categoryBanner}')">
        <img class="categoryArtwork" src="${categoryThumbnail}" alt="" loading="lazy" decoding="async">
        <span class="categoryTint"></span>
        <h3>${categoryName}</h3>
        <span class="categoryCardArrow"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
    </button>`;
}

async function GetCategories(name){
    const dbRef = ref(realdb);
    const [firstSnapshot, secondSnapshot] = await Promise.all([
        get(child(dbRef, "Categories/"+name)),
        get(child(dbRef, "Categories/"+(name + 1)))
    ]);
    const firstCard = firstSnapshot.exists() ? renderCategoryCard(firstSnapshot.val()) : "";
    const secondCard = secondSnapshot.exists() ? renderCategoryCard(secondSnapshot.val()) : "";
    return (firstCard || secondCard)
        ? `<li class="catItems" style="--cat-row-index: ${Math.floor((name - 1) / 2)}">${firstCard}${secondCard}</li>`
        : "";
}

async function generateCategories(){
    const categoryIds = [];
    for(let i = 1; i < brojKategorija; i += 2){
        categoryIds.push(i);
    }

    const categoryRows = await Promise.all(categoryIds.map(GetCategories));
    categoriesList.innerHTML = categoryRows.filter(Boolean).join("");
    if(document.querySelector(".searchScreen.activeMain")){
        window.crimsonAnimateSearchCategories?.();
    }
}

// ----- CATEGORY PAGE

let categoryPage = document.getElementsByClassName("categoryScreen")[0];
let categoryRecommendedPlaylistsList = document.getElementsByClassName("categoryRecommendedPlaylists")[0];
let categoryRecommendedSongsList = document.getElementsByClassName("categoryRecommendedSongs")[0];
let categoryLoadToken = 0;

let isCategoryPageOpen = false;

function renderCategorySongRow(songId, record, sourceName = "Categories"){
    const title = record.SongName;
    const creator = record.Creator;
    const image = getSongImage(record, "large");
    const imageSmall = getSongImage(record, "small");
    const color = record.Color;
    return `<li class="songItem">
        <div class="songInfo">
            <div class="songVisualizer"><span></span><span></span><span></span><span></span></div>
            <img src="${imageSmall}" alt="songBanner">
            <div class="songText"><h2>${title}</h2><h3>${creator}</h3></div>
        </div>
        <div class="songClickDiv" onclick="playerSelectedSong('${record.SongURL}','${title}','${creator}','${image}','${color}','${sourceName}',this.parentElement,'${songId}');"></div>
        <div class="songBtns"><button onclick="clickEffect(this); openPopup('song','${image}','${creator}','${title}','${songId}')"><i class="fa-solid fa-bars"></i></button></div>
    </li>`;
}

function renderCategoryPlaylistCard(playlistId, record){
    const name = record.Title;
    const banner = getPlaylistImage(record, "large");
    const bannerSmall = getPlaylistImage(record, "small");
    const likes = record.Likes;
    const songs = record.Songs || "";
    const artists = record.Artists || "";
    return `<li class="playlistItem" data-crimson-context="${encodeContextPayload({type: "publicPlaylist", id: playlistId, name, image: banner, imageSmall: bannerSmall, likes, songs, artists})}" onclick="openPlaylistPage(${playlistId},'${name}','${banner}','${likes}','${songs}');">
        <img src="${bannerSmall}" alt="playlistBanner">
        <h3>${name}</h3>
        <h5>${artists}</h5>
    </li>`;
}

async function loadCategoryContent(category, token){
    try{
        const [songsSnapshot, playlistsSnapshot] = await Promise.all([
            get(child(ref(realdb), "Songs")),
            get(child(ref(realdb), "PublicPlaylists"))
        ]);
        if(token !== categoryLoadToken){
            return;
        }

        const categoryLower = String(category).toLowerCase();
        const matchingSongs = Object.entries(songsSnapshot.val() || {}).filter(([, record]) =>
            record?.SongName && String(record.Categories || "").toLowerCase().includes(categoryLower)
        );
        const matchingPlaylists = Object.entries(playlistsSnapshot.val() || {}).filter(([, record]) =>
            record?.Title && String(record.Category || "").toLowerCase().includes(categoryLower)
        );

        categoryRecommendedSongsList.innerHTML = matchingSongs.length
            ? matchingSongs.map(([id, record]) => renderCategorySongRow(id, record)).join("")
            : emptyStateMarkup("No featured songs yet");
        categoryRecommendedPlaylistsList.innerHTML = matchingPlaylists.length
            ? matchingPlaylists.map(([id, record]) => renderCategoryPlaylistCard(id, record)).join("")
            : emptyStateMarkup("No featured playlists yet");
        categoryRecommendedSongsList.setAttribute("aria-busy", "false");
        categoryRecommendedPlaylistsList.setAttribute("aria-busy", "false");
        document.getElementById("categorySongCount").textContent = matchingSongs.length ? `${matchingSongs.length}` : "";
        document.getElementById("categoryPlaylistCount").textContent = matchingPlaylists.length ? `${matchingPlaylists.length}` : "";
        const songLabel = matchingSongs.length === 1 ? "song" : "songs";
        const playlistLabel = matchingPlaylists.length === 1 ? "playlist" : "playlists";
        document.getElementById("categoryMeta").textContent = `${matchingSongs.length} ${songLabel} · ${matchingPlaylists.length} ${playlistLabel}`;
    }catch(error){
        if(token !== categoryLoadToken){
            return;
        }
        categoryRecommendedSongsList.innerHTML = emptyStateMarkup("Could not load songs");
        categoryRecommendedPlaylistsList.innerHTML = emptyStateMarkup("Could not load playlists");
        categoryRecommendedSongsList.setAttribute("aria-busy", "false");
        categoryRecommendedPlaylistsList.setAttribute("aria-busy", "false");
    }
}

export function openCategoryPage(category, color, banner){

    window.crimsonShowView?.(categoryPage);
    categoryPage.classList.add('screenOpenOnTop');
    const categoryScroller = document.getElementById("screenScrollableCat");
    categoryScroller.scrollTop = 0;
    categoryScroller.children[0]?.classList.remove("pageBarOn");
    categoryScroller.children[1]?.classList.remove("pageBarOn2");
    const categoryHeroContent = categoryScroller.querySelector(".categoryHeroContent");
    if(categoryHeroContent){
        categoryHeroContent.style.opacity = 1;
        categoryHeroContent.style.transform = "";
    }

    if(lastOpenSideScreen != undefined && lastOpenSideScreen != null && lastOpenSideScreen != categoryPage){
        lastOpenSideScreen.classList.remove('screenOpenOnTop');
    }
    lastOpenSideScreen = categoryPage;

    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    let catBanners = document.getElementsByName("catBanner");
    catBanners.forEach((cat) => {
        cat.src = banner;
        cat.style.transform = "";
    })

    categoryPage.classList.add("categoryPageOpen");
    categoryPage.style.setProperty("--category-accent", color || "#8f59f5");
    let categoryNames = document.getElementsByName("categoryName");
    categoryNames.forEach((name) => {
        name.textContent = category;
    });

    document.getElementById("categoryMeta").textContent = "Curating this category...";
    document.getElementById("categorySongCount").textContent = "";
    document.getElementById("categoryPlaylistCount").textContent = "";
    document.getElementById("playCategoryBtn").onclick = () => {
        window.crimsonPlayCategoryFromContext?.({name: category});
    };
    showSkeleton(categoryRecommendedSongsList, "song", 5);
    showSkeleton(categoryRecommendedPlaylistsList, "playlist", 4);
    categoryLoadToken++;
    loadCategoryContent(category, categoryLoadToken);
    isCategoryPageOpen = true;
}

export function closeCategoryPage(){
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
    categoryPage.classList.remove("categoryPageOpen");
    isCategoryPageOpen = false;

    categoryPage.classList.remove("playerMovable");

    categoryPage.classList.remove('screenOpenOnTop');
    window.crimsonHideView?.(categoryPage, "categoryPageOpen", 350);
}

let closeCategoryPageBtn = document.getElementById("closeCategoryPage");
closeCategoryPageBtn.addEventListener('click', () => {
    closeCategoryPage();
});

function findPlaylistOfCategory(playlistName, inputText){
    let name = playlistName;

    let dbRef = ref(realdb);

    get(child(dbRef, "PublicPlaylists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            playlistName = snapshot.val().Title;
            let playlistCategory = snapshot.val().Category;
            if(playlistCategory.toLowerCase().includes(inputText.toLowerCase())){
                playlistBanner = getPlaylistImage(snapshot.val(), "large");
            playlistBannerSmall = getPlaylistImage(snapshot.val(), "small");
                playlistLikes = snapshot.val().Likes;
                playlistSongs = snapshot.val().Songs;
                playlistArtists = snapshot.val().Artists;
                let currentLi =  `<li class="playlistItem" data-crimson-context="${encodeContextPayload({type: "publicPlaylist", id: name, name: playlistName, image: playlistBanner, imageSmall: playlistBannerSmall, likes: playlistLikes, songs: playlistSongs || "", artists: playlistArtists || ""})}" onclick="openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                <img onload="buttonClickAnim(this.parentElement)" src="`+ playlistBannerSmall +`" alt="playlistBanner">
                <h3>`+ playlistName +`</h3>
                <h5>`+ playlistArtists +`</h5>
                </li>`;
                categoryRecommendedPlaylistsList.innerHTML += currentLi;
            }
        }
    })
}

let songCat = "";

function findSongOfCategory(songName, inputText){
    let name = songName;
    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songCat  = snapshot.val().Categories;
            if(songCat.includes(inputText)){
                songTitle  = snapshot.val().SongName;
                songToBePlayed = snapshot.val().SongURL;
                songCreator = snapshot.val().Creator;
                imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem">
                    <div class="songInfo">
                        <div class="songVisualizer">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <img src="`+imageURLSmall+`" alt="songBanner">
                        <div class="songText">
                            <h2>`+ songTitle +`</h2>
                            <h3>`+ songCreator +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','Search',this.parentElement,'`+ name +`');"></div>
                    <div class="songBtns">
                        <button onclick="clickEffect(this); openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
                    </div>
                    </li>`;
                categoryRecommendedSongsList.innerHTML += currentLI;
            }
        }
    })
}

// ----- ARTIST PAGE

let isArtistPageOpen = false;
let screenScrollables = document.getElementsByClassName("screenScrollable");

let closeArtistPageBtn = document.getElementById("closeArtistPage");
closeArtistPageBtn.addEventListener('click', ()=>{
    closeArtistPage();
})

export function closeArtistPage(){
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
    let artistScreen = document.getElementsByClassName("artistScreen")[0];
    artistScreen.classList.remove("artistScreenOpen");
    artistScreen.classList.remove('screenOpenOnTop');

    artistScreen.classList.remove("playerMovable");
    window.crimsonHideView?.(artistScreen, "artistScreenOpen", 350);

    isArtistPageOpen = false;
}

export async function openArtistPage(artistID, artistName, artistImage, artistFollowers, artistListens, artistAImage){

    let artistScreen = document.getElementsByClassName("artistScreen")[0];
    window.crimsonShowView?.(artistScreen);
    artistScreen.classList.add('screenOpenOnTop');
    artistSongs.setAttribute("name", artistName);

    if(lastOpenSideScreen != undefined && lastOpenSideScreen != null && lastOpenSideScreen != artistScreen){
        lastOpenSideScreen.classList.remove('screenOpenOnTop');
    }
    lastOpenSideScreen = artistScreen;

    checkIfArtistIsFollowed(artistID);

    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    for (let i = 0; i < screenScrollables.length; i++) {
        screenScrollables[i].scrollTop = 0;
    }
    
    if(!isArtistPageOpen){
        artistScreen.classList.add("artistScreenOpen");
        isArtistPageOpen = true;
    }

    let artistBanners = document.getElementsByName("artistBanner");
    let artistNames = document.getElementsByName("artistName");
    let artistFollowersSpans = document.getElementsByName("artistFollowers");

    artistBanners.forEach((banner) => {
        banner.src = artistImage;
    });

    artistNames.forEach((name) => {
        name.innerHTML = artistName;
    });

    artistFollowersSpans.forEach((followers) => {
        followers.innerHTML = artistFollowers;
    });

    const latestReleaseList = document.getElementsByClassName("latestRelease")[0];
    latestReleaseList.setAttribute("name", artistName);
    showSkeleton(latestReleaseList, "song", 1);
    showSkeleton(artistSongs, "song", 5);
    showSkeleton(artistAppearsOnList, "playlist", 4);
    loadArtistContent(artistName);

    const followArtistBtn = document.getElementById('followArtistBtn');
    followArtistBtn.addEventListener('click', () => {
        if(UserSignedIn()){
            followArtist(artistID);
        }else{
            openLoginPopup();
        }
    });

    if(artistAImage != undefined){
        document.getElementById("artistAboutBanner").src = artistAImage;
    }

    setTimeout(() => {
        defaultPlaylistSort = document.querySelector('.artistSongs').innerHTML;
    }, 500);
}

export function openArtistPageByName(artistName2){

    let dbRef = ref(realdb);
    let artistID, artistName, artistImage, artistFollowers, artistListens, artistAImage;
    let br = 0;
    
    for (let i = 1; i < brojArtista; i++) {
        get(child(dbRef, "Artists/"+i)).then((snapshot)=>{
            if(snapshot.exists()){
                let ArtistName = artistName2.split(',')[0];

                artistName = snapshot.val().Artist;

                if(artistName.includes(ArtistName)){
                    artistID = i;
                    artistImage = getArtistImage(snapshot.val(), "large");
            artistImageSmall = getArtistImage(snapshot.val(), "small");
                    artistFollowers = snapshot.val().Followers;
                    artistListens = snapshot.val().Listens;
                    artistAImage = getArtistAboutImage(snapshot.val(), "large");
                    br = 1;
                    closeBigPlayer();
                    openArtistPage(artistID, artistName, artistImage, artistFollowers, artistListens, artistAImage);
                }
            }
        })
        if(br == 1){
            break;
        }
    }
}

function checkIfArtistIsFollowed(artistId){
    const dbRef = ref(realdb);
    const followArtistBtn = document.getElementById('followArtistBtn');

    if(currentUser != undefined){
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let setFollowedArtists = snapshot.val().FollowedArtists;
                if(setFollowedArtists == undefined){
                    setFollowedArtists = "";
                }
    
                let fArtistsCut = setFollowedArtists.split(',');
                if(fArtistsCut.includes(String(artistId))){
                    followArtistBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Unfollow`;
                }else{
                    followArtistBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Follow`;
                }
            }
        })
    }
}

function followArtist(artistId){
    const dbRef = ref(realdb);

    if(currentUser != undefined){
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let setUsername = snapshot.val().Username;
                let setEmail = snapshot.val().Email;
                let setLikedSongs = snapshot.val().LikedSongs;
                let setPassword = snapshot.val().Password;
                let setPlaylists = snapshot.val().Playlists;
                let setProfilePhoto = snapshot.val().ProfilePhoto;
                let setTheme = snapshot.val().AppTheme;
                let setFollowedArtists = snapshot.val().FollowedArtists;
                let setLikedPlaylists = snapshot.val().LikedPlaylists;
                if(setFollowedArtists == undefined){
                    setFollowedArtists = "";
                }
                if(setLikedSongs == undefined){
                    setLikedSongs = "";
                }
                if(setLikedPlaylists == undefined){
                    setLikedPlaylists = "";
                }
                if(setPlaylists == undefined){
                    setPlaylists = "";
                }
    
                let isArtistFollowed = false;
                let newFollowedArtists;
                let fArtistsCut = setFollowedArtists.split(',');
                if(fArtistsCut.includes(String(artistId))){
                    isArtistFollowed = true;
                    for (let i = 0; i < fArtistsCut.length; i++) {
                        if(fArtistsCut[i] == artistId){
                            fArtistsCut.splice(i, 1);
                        }
                    }
                    newFollowedArtists = fArtistsCut.join(',');
                }else{
                    isArtistFollowed = false;
                    newFollowedArtists = setFollowedArtists + artistId + ",";
                }
    
                update(ref(realdb, "Users/"+currentUser.Username), {FollowedArtists: newFollowedArtists})
                .then(()=>{
                    const followArtistBtn = document.getElementById('followArtistBtn');
    
                    get(child(dbRef, "Artists/"+artistId)).then((snapshot)=>{
                        if(snapshot.exists()){
                            let artistFollowers = snapshot.val().Followers;
    
                            if(!isArtistFollowed){
                                update(ref(realdb, "Artists/"+artistId), {
                                    Followers: String(Number(artistFollowers)+1)
                                })
                                .then(()=>{
                                    // LoadUserFArtists();
                                    followArtistBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Unfollow`;
                                    window.crimsonPlayfulBurst?.(followArtistBtn, "follow");
                                })
                                .catch((error)=>{
                                    alert("error "+error);
                                })
                            }else{
                                update(ref(realdb, "Artists/"+artistId), {
                                    Followers: String(Number(artistFollowers)-1)
                                })
                                .then(()=>{
                                    // LoadUserFArtists();
                                    followArtistBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Follow`;
                                    window.crimsonPlayfulBurst?.(followArtistBtn, "unfollow");
                                })
                                .catch((error)=>{
                                    alert("error "+error);
                                })
                            }
                        }
                    })
                })
                .catch((error)=>{
                    alert("error "+error);
                })
            }
        })
    }
}

window.crimsonIsArtistFollowed = async function(artistId){
    if(currentUser == undefined){
        return false;
    }

    const snapshot = await get(child(ref(realdb), "Users/"+currentUser.Username));
    const followedArtists = String(snapshot.val()?.FollowedArtists || "").split(',');
    return followedArtists.includes(String(artistId));
}

window.crimsonToggleArtistFollow = function(artistId){
    if(currentUser == undefined){
        openLoginPopup();
        return false;
    }

    followArtist(artistId);
    return true;
}

function SetTheLatestRelease(artist){
    let latestReleaseLi = "";
    let dbRef = ref(realdb);

    for (let i = 0; i < brojPesama; i++) {
            // console.log(i);
            get(child(dbRef, "Songs/"+i)).then((snapshot)=>{
                if(snapshot.exists()){
                    songCreator = snapshot.val().Creator;
                    if(songCreator.includes(artist)){
                        songToBePlayed = snapshot.val().SongURL;
                        songTitle  = snapshot.val().SongName;
                        imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
                        songColor = snapshot.val().Color;
                        latestReleaseLi =  `<li class="songItem">
                            <div class="songInfo">
                                <div class="songVisualizer">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <img src="`+imageURLSmall+`" alt="songBanner">
                                <div class="songText">
                                    <h2>`+ songTitle +`</h2>
                                    <h3>`+ songCreator +`</h3>
                                </div>
                            </div>
                            <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','',this.parentElement,'`+ i +`');"></div>
                            <div class="songBtns">
                                <button onclick="openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ i +`')"><i class="fa-solid fa-bars"></i></button>
                            </div>
                        </li>`;

                        document.getElementsByClassName("latestRelease")[0].innerHTML = "";
                        document.getElementsByClassName("latestRelease")[0].innerHTML = latestReleaseLi;
                    }
                }
            })
    }
}

let artistAppearsOnList = document.getElementsByClassName("artistAppearsOn")[0];

function GetPlaylistsArtistAppearsOn(playlistName,artist){
    let name = playlistName;

    artistAppearsOnList.innerHTML = "";

    let dbRef = ref(realdb);

    get(child(dbRef, "PublicPlaylists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            playlistArtists = snapshot.val().Artists;
            if(playlistArtists.toLowerCase().includes(artist.toLowerCase())){
                playlistName = snapshot.val().Title;
                playlistBanner = getPlaylistImage(snapshot.val(), "large");
            playlistBannerSmall = getPlaylistImage(snapshot.val(), "small");
                playlistLikes = snapshot.val().Likes;
                playlistSongs = snapshot.val().Songs;
                let currentLi =  `<li class="playlistItem" data-crimson-context="${encodeContextPayload({type: "publicPlaylist", id: name, name: playlistName, image: playlistBanner, imageSmall: playlistBannerSmall, likes: playlistLikes, songs: playlistSongs || "", artists: playlistArtists || ""})}" onclick="openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                <img onload="buttonClickAnim(this.parentElement)" src="`+ playlistBannerSmall +`" alt="playlistBanner">
                <h3>`+ playlistName +`</h3>
                <h5>`+ playlistArtists +`</h5>
                </li>`;

                artistAppearsOnList.innerHTML += currentLi;
            }
        }
    })
}

let artistSongs = document.getElementsByClassName("artistSongs")[0];
let artistContentToken = 0;

async function loadArtistContent(artist){
    const token = ++artistContentToken;
    try{
        const [songsSnapshot, playlistsSnapshot] = await Promise.all([
            get(child(ref(realdb), "Songs")),
            get(child(ref(realdb), "PublicPlaylists"))
        ]);
        if(token !== artistContentToken){
            return;
        }

        const artistLower = String(artist).toLowerCase();
        const matchingSongs = Object.entries(songsSnapshot.val() || {}).filter(([, record]) =>
            record?.SongName && String(record.Creator || "").toLowerCase().includes(artistLower)
        );
        const matchingPlaylists = Object.entries(playlistsSnapshot.val() || {}).filter(([, record]) =>
            record?.Title && String(record.Artists || "").toLowerCase().includes(artistLower)
        );
        const latestReleaseList = document.getElementsByClassName("latestRelease")[0];
        const latestSong = matchingSongs[matchingSongs.length - 1];

        latestReleaseList.innerHTML = latestSong
            ? renderCategorySongRow(latestSong[0], latestSong[1], "Artists")
            : emptyStateMarkup("No releases yet");
        artistSongs.innerHTML = matchingSongs.length
            ? matchingSongs.map(([id, record]) => renderCategorySongRow(id, record, "Artists")).join("")
            : emptyStateMarkup("No tracks yet");
        artistAppearsOnList.innerHTML = matchingPlaylists.length
            ? matchingPlaylists.map(([id, record]) => renderCategoryPlaylistCard(id, record)).join("")
            : emptyStateMarkup("No playlist appearances yet");
        [latestReleaseList, artistSongs, artistAppearsOnList].forEach((list) => list.setAttribute("aria-busy", "false"));
        defaultPlaylistSort = artistSongs.innerHTML;
    }catch(error){
        if(token !== artistContentToken){
            return;
        }
        document.getElementsByClassName("latestRelease")[0].innerHTML = emptyStateMarkup("Could not load release");
        artistSongs.innerHTML = emptyStateMarkup("Could not load tracks");
        artistAppearsOnList.innerHTML = emptyStateMarkup("Could not load playlists");
    }
}

function GenerateOneSongFromArtist(songName,artist){
    let name = songName;

    artistSongs.innerHTML = "";

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songCreator = snapshot.val().Creator;
            if(songCreator.toLowerCase().includes(artist.toLowerCase())){
                songToBePlayed = snapshot.val().SongURL;
                songTitle  = snapshot.val().SongName;
                imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem">
                    <div class="songInfo">
                        <div class="songVisualizer">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <img src="`+imageURLSmall+`" alt="songBanner">
                        <div class="songText">
                            <h2>`+ songTitle +`</h2>
                            <h3>`+ songCreator +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','',this.parentElement,'`+ name +`');"></div>
                    <div class="songBtns">
                        <button onclick="openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
                    </div>
                </li>`;
                artistSongs.innerHTML += currentLI;
            }
        }
    })
}

// ----- PLAYLIST PAGE

let playlistSongsList = document.getElementsByClassName("playlistSongsList")[0];
let playlistContentToken = 0;

async function loadPlaylistSongRows(songIds, sourceName = "Playlist"){
    const token = ++playlistContentToken;
    const cleanIds = songIds.map(String).filter(Boolean);
    if(cleanIds.length === 0){
        playlistSongsList.innerHTML = emptyStateMarkup("This playlist is empty");
        playlistSongsList.setAttribute("aria-busy", "false");
        return;
    }

    showSkeleton(playlistSongsList, "song", Math.min(6, Math.max(3, cleanIds.length)));
    try{
        const songRecords = await Promise.all(cleanIds.map(async (songId) => {
            const snapshot = await get(child(ref(realdb), "Songs/"+songId));
            return snapshot.exists() ? [songId, snapshot.val()] : null;
        }));
        if(token !== playlistContentToken){
            return;
        }
        const availableSongs = songRecords.filter(Boolean);
        playlistSongsList.innerHTML = availableSongs.length
            ? availableSongs.map(([id, record]) => renderCategorySongRow(id, record, sourceName)).join("")
            : emptyStateMarkup("No available songs");
        playlistSongsList.setAttribute("aria-busy", "false");
        defaultPlaylistSort = playlistSongsList.innerHTML;
    }catch(error){
        if(token === playlistContentToken){
            playlistSongsList.innerHTML = emptyStateMarkup("Could not load playlist songs");
            playlistSongsList.setAttribute("aria-busy", "false");
        }
    }
}

let isPlaylistPageOpen = false;

export function openPlaylistPage(playlistID, pName, pBanner, pLikes, pSongs){

    let playlistScreen = document.getElementsByClassName("playlistScreen")[0];
    window.crimsonShowView?.(playlistScreen);
    playlistScreen.classList.add('screenOpenOnTop');
    playlistSongsList.setAttribute("name", pName);
    document.getElementById("editOwnedPlaylistBtn").style.display = "none";

    if(lastOpenSideScreen != undefined && lastOpenSideScreen != null && lastOpenSideScreen != playlistScreen){
        lastOpenSideScreen.classList.remove('screenOpenOnTop');
    }
    lastOpenSideScreen = playlistScreen;

    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    if(document.getElementById("playlistChecker").innerHTML !== pName){

        document.getElementById("playlistLikesH5").style.display = "block";
        document.getElementById("likePlaylist").style.display = "flex";

        playlistScreen.classList.add("playlistScreenOpen");
        isPlaylistPageOpen = true;

        let playlistBanners = document.getElementsByName("playlistBanner");
        playlistBanners.forEach((banner) => {
            banner.src = pBanner;
        })

        let playlistNamess = document.getElementsByName("playlistName");
        playlistNamess.forEach((name) => {
            name.innerHTML = pName;
        })

        let playlistLikess = document.getElementsByName("playlistLikes");
        playlistLikess.forEach((like) => {
            like.innerHTML = pLikes;
        })

        IsPPlaylistLiked(playlistID);

        let playlistSongss = String(pSongs || "").split(',').filter(Boolean);
        loadPlaylistSongRows(playlistSongss, pName);

        document.getElementById('likePlaylist').setAttribute('name',playlistID);

    }else{
        playlistScreen.classList.add("playlistScreenOpen");
        isPlaylistPageOpen = true;
    }
}

function GenerateOneSongFromPlaylist(songName){
    let name = songName;

    playlistSongsList.innerHTML = "";

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songCreator = snapshot.val().Creator;
                songToBePlayed = snapshot.val().SongURL;
                songTitle  = snapshot.val().SongName;
                imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem">
                <div class="songInfo">
                    <div class="songVisualizer">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <img src="`+imageURLSmall+`" alt="songBanner">
                    <div class="songText">
                        <h2>`+ songTitle +`</h2>
                        <h3>`+ songCreator +`</h3>
                    </div>
                </div>
                <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','',this.parentElement,'`+ name +`');"></div>
                <div class="songBtns">
                    <button onclick="openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
                </div>
            </li>`;
            playlistSongsList.innerHTML += currentLI;
        }
    })
}

export function closePlaylistPage(){

    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");

    let playlistScreen = document.getElementsByClassName("playlistScreen")[0];
    playlistScreen.classList.remove("playlistScreenOpen");
    isPlaylistPageOpen = false;

    playlistScreen.classList.remove("playerMovable");

    playlistScreen.classList.remove('screenOpenOnTop');
    window.crimsonHideView?.(playlistScreen, "playlistScreenOpen", 350);
}

const closePlaylistBtn = document.getElementById("closePlaylistPage");
closePlaylistBtn.addEventListener(('click'), () => {
    closePlaylistPage();
});

const likePlaylistBtn = document.getElementById('likePlaylist');
likePlaylistBtn.addEventListener('click', () => {
    
    const dbRef = ref(realdb);

    if(currentUser != undefined){
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let setUsername = snapshot.val().Username;
                let setEmail = snapshot.val().Email;
                let setLikedSongs = snapshot.val().LikedSongs;
                let setPassword = snapshot.val().Password;
                let setPlaylists = snapshot.val().Playlists;
                let setProfilePhoto = snapshot.val().ProfilePhoto;
                let setTheme = snapshot.val().AppTheme;
                let setLikedPlaylists = snapshot.val().LikedPlaylists;
                let setFollowedArtists = snapshot.val().FollowedArtists;
                if(setFollowedArtists == undefined){
                    setFollowedArtists = "";
                }
                if(setLikedSongs == undefined){
                    setLikedSongs = "";
                }
                if(setLikedPlaylists == undefined){
                    setLikedPlaylists = "";
                }
                if(setPlaylists == undefined){
                    setPlaylists = "";
                }

                let slpArray = setLikedPlaylists.split(',');
                let playlistID = likePlaylistBtn.getAttribute('name');
                if(!slpArray.includes(playlistID)){
                    setLikedPlaylists += playlistID + ",";

                    update(ref(realdb, "Users/"+currentUser.Username), {LikedPlaylists: setLikedPlaylists})
                    .then(()=>{
                        // console.log("Uspesno!");
                        likePlaylistBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                        window.crimsonPlayfulBurst?.(likePlaylistBtn, "like");
                        LoadLikedPlaylists();
                    })
                    .catch((error)=>{
                        alert("error "+error);
                    })
                }else{
                    slpArray = slpArray.filter(function(item) {
                        return item !== playlistID;
                    });
                    setLikedPlaylists = slpArray.join(',');

                    update(ref(realdb, "Users/"+currentUser.Username), {LikedPlaylists: setLikedPlaylists})
                    .then(()=>{
                        // console.log("Uspesno!");
                        likePlaylistBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                        window.crimsonPlayfulBurst?.(likePlaylistBtn, "unlike");
                        LoadLikedPlaylists();
                    })
                    .catch((error)=>{
                        alert("error "+error);
                    })
                }
            }
        })
    }else{
        openLoginPopup();
    }
});

function IsPPlaylistLiked(id){

    const dbRef = ref(realdb);

    id = id + "";

    if(currentUser != undefined){
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let slpArray
                let setLikedPlaylists = snapshot.val().LikedPlaylists;
                if(setLikedPlaylists != undefined){
                    slpArray = setLikedPlaylists.split(',');
                }else{
                    slpArray = "";
                }
                if(slpArray.includes(id)){
                    likePlaylistBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                }else{
                    likePlaylistBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                }
            }
        })
    }
}

window.crimsonIsPlaylistLiked = async function(playlistId){
    if(currentUser == undefined){
        return false;
    }

    const snapshot = await get(child(ref(realdb), "Users/"+currentUser.Username));
    const likedPlaylists = String(snapshot.val()?.LikedPlaylists || "").split(',');
    return likedPlaylists.includes(String(playlistId));
}

window.crimsonTogglePlaylistLike = function(playlistId){
    likePlaylistBtn.setAttribute('name', String(playlistId));
    likePlaylistBtn.click();
}

// ----- THE VAULT

let vaultSongArray = [];

let isTheVaultOn = false;

export function vaultEmotionLoad(categ){
    playRandomSongForTheVault(categ);
    closeTheVault();
}

function playerSelectedSongVault(songName){
    let name = songName;

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songCreator = snapshot.val().Creator;
            songToBePlayed = snapshot.val().SongURL;
            songTitle  = snapshot.val().SongName;
            imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
            songColor = snapshot.val().Color;

            playerSelectedSong(songToBePlayed,songTitle,songCreator,imageURL,songColor,"TheVault",'',name);
        }
    })
}

export function playRandomSongForTheVault(categ){
    if(categ != undefined || categ != null){
        setTheVault();

        let dbRef = ref(realdb);

        get(child(dbRef, "SongsByMoods/"+categ)).then((snapshot)=>{
            if(snapshot.exists()){
                let setSongs = snapshot.val().Songs;
                setSongs += "";
                vaultSongArray = setSongs.split(',');

                let songToPlayV = Math.floor(Math.random() * vaultSongArray.length);
                playerSelectedSongVault(vaultSongArray[songToPlayV]);
            }
        })
    }else{
        let songToPlayV = Math.floor(Math.random() * vaultSongArray.length);
        playerSelectedSongVault(vaultSongArray[songToPlayV]);
    }
}

// ----- Make a playlist

let numberOfPlaylists = 0;

export function MakeAPlaylist(){
    OpenMakePlaylistScreen();
}

export async function SubmitAPlaylist(){
    if(document.getElementById("submitMakePlaylist").disabled){
        return;
    }

    try{
        setMakePlaylistLoading(true, isEditingPlaylist() ? "Saving playlist..." : "Creating playlist...");
        let result = await UploadProcess();

        if(result){
            await DBMakePl();
        }
    }catch(error){
        alert("error " + error);
        setMakePlaylistLoading(false);
    }
}

let currentMakePlaylistName = document.querySelector('.currentMakePlaylistName');
function isEditingPlaylist(){
    return document.querySelector('.makePlaylistScreen').children[0].children[0].children[1].innerHTML == "Edit Playlist";
}

function setMakePlaylistLoading(isLoading, text){
    const form = document.querySelector('.makePlaylistForm');
    const button = document.getElementById("submitMakePlaylist");
    const statusText = document.getElementById("makePlaylistStatusText");
    const editing = isEditingPlaylist();

    form.classList.toggle("makePlaylistSubmitting", isLoading);
    button.disabled = isLoading;
    button.value = isLoading ? (editing ? "Saving..." : "Creating...") : (editing ? "Save" : "Create");

    if(statusText != null && text != undefined){
        statusText.innerHTML = text;
    }
}

function shouldDeleteStorageImage(url){
    return url != undefined && url != null && url != "" && !url.includes("defaultPlaylist.webp") && (url.includes("firebasestorage.googleapis.com") || url.startsWith("gs://"));
}

function deleteReplacedPlaylistCover(oldUrl, newUrl){
    if(!shouldDeleteStorageImage(oldUrl) || oldUrl == newUrl){
        return;
    }

    try{
        deleteObject(sRef(getStorage(), oldUrl)).catch(() => {});
    }catch(error){}
}

function closeMakePlaylistAfterSave(){
    if(typeof window.CloseMakePlaylistScreen == "function"){
        window.CloseMakePlaylistScreen();
    }
}

async function DBMakePl(){
    const dbRef = ref(realdb);
        if(currentUser == undefined){
            setMakePlaylistLoading(false);
            return;
        }
        if(currentUser != undefined && !isEditingPlaylist()){
            await get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
                if(snapshot.exists()){
                    let setUsername = snapshot.val().Username;
                    let setEmail = snapshot.val().Email;
                    let setLikedSongs = snapshot.val().LikedSongs;
                    let setPassword = snapshot.val().Password;
                    let setPlaylists = snapshot.val().Playlists;
                    let setProfilePhoto = snapshot.val().ProfilePhoto;
                    let setTheme = snapshot.val().AppTheme;
                    let setLikedPlaylists = snapshot.val().LikedPlaylists;
                    let setFollowedArtists = snapshot.val().FollowedArtists;
                    if(setFollowedArtists == undefined){
                        setFollowedArtists = "";
                    }
                    if(setLikedPlaylists == undefined){
                        setLikedPlaylists = "";
                    }
                    if(setLikedSongs == undefined){
                        setLikedSongs = "";
                    }
                    if(setPlaylists == undefined){
                        setPlaylists = "";
                    }

                    const newPlaylistId = numberOfPlaylists + 1;
                    const newPlaylistName = currentMakePlaylistName.innerHTML;
        
                    return update(ref(realdb, "Users/"+currentUser.Username), {
                        Playlists: (setPlaylists + "{" + newPlaylistId + "}" + newPlaylistName + "}" + imageDownload + "}}")
                    })
                    .then(()=>{
                        setMakePlaylistLoading(false);
                        LoadUserPlaylists();
                        closeMakePlaylistAfterSave();
                        openMyPlaylistPage(newPlaylistId, newPlaylistName, imageDownload, "0", "");
                    })
                    .catch((error)=>{
                        setMakePlaylistLoading(false);
                        alert("error "+error);
                    })
                }else{
                    setMakePlaylistLoading(false);
                }
            })
        }
        else if(currentUser != undefined && isEditingPlaylist()){
            await get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
                if(snapshot.exists()){

                    let newSetPlaylists = "";
                    const editedPlaylistId = currentMakePlaylistName.getAttribute('data-playlist-id');
                    const editedPlaylistName = currentMakePlaylistName.innerHTML;
                    const editedPlaylistSongs = currentMakePlaylistName.getAttribute('data-playlist-songs') || "";
                    const oldPlaylistBanner = currentMakePlaylistName.getAttribute('data-playlist-banner') || "images/defaultPlaylist.webp";

                    let setUsername = snapshot.val().Username;
                    let setEmail = snapshot.val().Email;
                    let setLikedSongs = snapshot.val().LikedSongs;
                    let setPassword = snapshot.val().Password;
                    let setPlaylists = snapshot.val().Playlists;
                    let setProfilePhoto = snapshot.val().ProfilePhoto;
                    let setTheme = snapshot.val().AppTheme;
                    let setFollowedArtists = snapshot.val().FollowedArtists;
                    let setLikedPlaylists = snapshot.val().LikedPlaylists;
                    setFollowedArtists = snapshot.val().FollowedArtists;
                    if(setFollowedArtists == undefined){
                        setFollowedArtists = "";
                    }
                    if(setLikedSongs == undefined){
                        setLikedSongs = "";
                    }
                    if(setLikedPlaylists == undefined){
                        setLikedPlaylists = "";
                    }
                    if(setPlaylists == undefined){
                        setPlaylists = "";
                    }
    
                    let usersPlaylists = setPlaylists.split('{');
    
                    for (let i = 0; i < usersPlaylists.length; i++) {
                        if(i == (usersPlaylists.length-1)){
                            if(usersPlaylists[i].split('}')[0] != editedPlaylistId){
                                newSetPlaylists += usersPlaylists[i];
                            }else{
                                newSetPlaylists += editedPlaylistId + "}" + editedPlaylistName + "}" + imageDownload + "}" + editedPlaylistSongs + "}";
                            }
                        }else{
                            if(usersPlaylists[i].split('}')[0] != editedPlaylistId){
                                newSetPlaylists += usersPlaylists[i] + "{";
                            }else{
                                newSetPlaylists += editedPlaylistId + "}" + editedPlaylistName + "}" + imageDownload + "}" + editedPlaylistSongs + "}" + "{";
                            }
                        }
                    }
    
                    return update(ref(realdb, "Users/"+currentUser.Username), {Playlists: newSetPlaylists})
                    .then(()=>{
                        deleteReplacedPlaylistCover(oldPlaylistBanner, imageDownload);
                        setMakePlaylistLoading(false);
                        LoadUserPlaylists();
                        closeMakePlaylistAfterSave();
                        openMyPlaylistPage(editedPlaylistId, editedPlaylistName, imageDownload, "0", editedPlaylistSongs);
                    })
                    .catch((error)=>{
                        setMakePlaylistLoading(false);
                        alert("error "+error);
                    })
                }else{
                    setMakePlaylistLoading(false);
                }
            })
        }
}

// ----- GENERATING YOURS PAGE

let yoursPage = document.getElementsByClassName("yoursScreen")[0];
let yourPlaylists = document.getElementsByClassName("yourPlaylists")[0];
let yourFArtists = document.getElementsByClassName("yourFArtists")[0];
let yourLPlaylists = document.getElementsByClassName('yourLPlaylists')[0];

function favoritesLibraryMarkup(){
    return `<li class="songItem favoritesLibraryItem" data-crimson-context="${encodeContextPayload({type: "libraryPlaylist", id: 0, name: "Favorites", image: "images/favoritesPlaylistPage.gif", artists: "Simply yours", favorites: true})}" onclick="openLikedSongs();">
        <div class="songInfo">
            <img src="images/favorites.jpg" alt="playlistBanner">
            <div class="songText">
                <h2>Favorites</h2>
                <h3>Simply yours</h3>
            </div>
        </div>
    </li>`;
}

async function LoadUserPlaylists(){
    const favoritesMarkup = favoritesLibraryMarkup();
    yourPlaylists.innerHTML = favoritesMarkup;

    if(currentUser == null || currentUser == undefined){
        yourPlaylists.setAttribute("aria-busy", "false");
        return;
    }

    showSkeleton(yourPlaylists, "song", 2, true);
    try{
        const snapshot = await get(child(ref(realdb), "Users/"+currentUser.Username));
        const playlistRows = [];
        if(snapshot.exists()){
            const usersPlaylists = String(snapshot.val().Playlists || "").split('{');
            numberOfPlaylists = usersPlaylists.length - 1;

            for (let i = numberOfPlaylists; i > 0; i--) {
                const playlistParts = usersPlaylists[i].split('}');
                if(!playlistParts[0] || !playlistParts[1]){
                    continue;
                }
                playlistRows.push(`<li class="songItem" id="`+ playlistParts[0] +`">
                    <div class="songInfo">
                        <img src="`+ playlistParts[2] +`" alt="playlistBanner">
                        <div class="songText">
                            <h2>`+ playlistParts[1] +`</h2>
                            <h3>`+ "by " + currentUser.Username +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="clickEffect(this); openMyPlaylistPage(`+ playlistParts[0] +`,'`+ playlistParts[1] +`','`+ playlistParts[2] +`','`+ 0 +`','`+ (playlistParts[3] || "") +`');"></div>
                    <div class="songBtns">
                        <button onclick="openPopup('playlist','`+ playlistParts[2] +`','`+ "by " + currentUser.Username +`','`+ playlistParts[1] +`',${playlistParts[0]},'${playlistParts[3] || ""}')"><i class="fa-solid fa-bars"></i></button>
                    </div>
                </li>`);
            }
        }
        yourPlaylists.innerHTML = favoritesMarkup + playlistRows.join("");
        yourPlaylists.setAttribute("aria-busy", "false");
    }catch(error){
        yourPlaylists.innerHTML = favoritesMarkup;
        yourPlaylists.setAttribute("aria-busy", "false");
    }
}

function DeLoadUserPlaylists(){
    yourPlaylists.innerHTML = "";
}

async function LoadUserFArtists(){
    if(currentUser == undefined){
        yourFArtists.innerHTML = "";
        yourFArtists.setAttribute("aria-busy", "false");
        return;
    }

    showSkeleton(yourFArtists, "artist", 4);
    try{
        const userSnapshot = await get(child(ref(realdb), "Users/"+currentUser.Username));
        const followedArtistIds = String(userSnapshot.val()?.FollowedArtists || "").split(',').filter(Boolean).reverse();
        const artistRows = await Promise.all(followedArtistIds.map(async (artistId) => {
            const snapshot = await get(child(ref(realdb), "Artists/"+artistId));
            if(!snapshot.exists()){
                return "";
            }
            const record = snapshot.val();
            const name = record.Artist;
            const image = getArtistImage(record, "large");
            const imageSmall = getArtistImage(record, "small");
            const followers = record.Followers;
            const listens = record.Listens;
            const aboutImage = getArtistAboutImage(record, "large");
            return `<li id="song${artistId}" class="artistItem" data-crimson-context="${encodeContextPayload({type: "artist", id: artistId, name, image, imageSmall, followers, listens, aboutImage})}" onclick="openArtistPage(${artistId},'${name}','${image}','${followers}','${listens}','${aboutImage}');">
                <img onload="buttonClickAnim(this.parentElement)" src="${imageSmall}" alt="artistImage">
                <h3>${name}</h3>
            </li>`;
        }));
        yourFArtists.innerHTML = artistRows.filter(Boolean).join("") || emptyStateMarkup("Artists you follow will appear here");
        yourFArtists.setAttribute("aria-busy", "false");
    }catch(error){
        yourFArtists.innerHTML = emptyStateMarkup("Could not load followed artists");
        yourFArtists.setAttribute("aria-busy", "false");
    }
}

function GetArtists2(artistName){
    return get(child(ref(realdb), "Artists/"+artistName)).then((snapshot) => {
        if(!snapshot.exists()){
            return;
        }
        clearSkeleton(yourFArtists);
    });
}

function DeLoadUserFArtists(){
    yourFArtists.innerHTML = "";
}

export function openMyPlaylistPage(playlistID, pName, pBanner, pLikes, pSongs){

    const playlistScreen = document.getElementsByClassName("playlistScreen")[0];
    window.crimsonShowView?.(playlistScreen);
    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");
    playlistSongsList.setAttribute("name", pName);

        document.getElementById("playlistLikesH5").style.display = "none";
        document.getElementById("likePlaylist").style.display = "none";
        const editPlaylistBtn = document.getElementById("editOwnedPlaylistBtn");
        if(playlistID == 0 || pName == "Favorites"){
            editPlaylistBtn.style.display = "none";
        }else{
            editPlaylistBtn.style.display = "flex";
            editPlaylistBtn.onclick = () => {
                if(typeof window.OpenMakePlaylistScreen == "function"){
                    window.OpenMakePlaylistScreen(true, playlistID, pName, pBanner, pSongs);
                }
            };
        }

        playlistScreen.classList.add("playlistScreenOpen");
        isPlaylistPageOpen = true;

        let playlistBanners = document.getElementsByName("playlistBanner");
        playlistBanners.forEach((banner) => {
            banner.src = pBanner;
        })

        let playlistNamess = document.getElementsByName("playlistName");
        playlistNamess.forEach((name) => {
            name.innerHTML = pName;
        })

        let playlistLikess = document.getElementsByName("playlistLikes");
        playlistLikess.forEach((like) => {
            like.innerHTML = pLikes;
        })

        const playlistSongss = String(pSongs || "").split(',').filter(Boolean).reverse();
        loadPlaylistSongRows(playlistSongss, pName);
}



async function LoadLikedPlaylists(){
    if(currentUser == null || currentUser == undefined){
        yourLPlaylists.innerHTML = "";
        yourLPlaylists.setAttribute("aria-busy", "false");
        return;
    }

    showSkeleton(yourLPlaylists, "song", 3);
    try{
        const userSnapshot = await get(child(ref(realdb), "Users/"+currentUser.Username));
        const likedPlaylistIds = String(userSnapshot.val()?.LikedPlaylists || "").split(',').filter(Boolean);
        const playlistRows = await Promise.all(likedPlaylistIds.map(async (playlistId) => {
            const snapshot = await get(child(ref(realdb), "PublicPlaylists/"+playlistId));
            if(!snapshot.exists()){
                return "";
            }
            const record = snapshot.val();
            const name = record.Title;
            const banner = getPlaylistImage(record, "large");
            const bannerSmall = getPlaylistImage(record, "small");
            const likes = record.Likes;
            const songs = record.Songs || "";
            const artists = record.Artists || "";
            return `<li class="songItem" id="${playlistId}" data-crimson-context="${encodeContextPayload({type: "publicPlaylist", id: playlistId, name, image: banner, imageSmall: bannerSmall, likes, songs, artists})}">
                <div class="songInfo">
                    <img src="${bannerSmall}" alt="playlistBanner">
                    <div class="songText"><h2>${name}</h2><h3>by ${artists}</h3></div>
                </div>
                <div class="songClickDiv" onclick="clickEffect(this); openPlaylistPage(${playlistId},'${name}','${banner}','${likes}','${songs}');"></div>
            </li>`;
        }));
        yourLPlaylists.innerHTML = playlistRows.filter(Boolean).join("") || emptyStateMarkup("Liked playlists will appear here");
        yourLPlaylists.setAttribute("aria-busy", "false");
    }catch(error){
        yourLPlaylists.innerHTML = emptyStateMarkup("Could not load liked playlists");
        yourLPlaylists.setAttribute("aria-busy", "false");
    }
}

function DeLoadLikedPlaylists(){
    yourLPlaylists.innerHTML = "";
}

// ----- MAKING A PLAYLIST

let reader = new FileReader();
let files = [];
let imageDownload;
let imageFileName = "";
let imageInput = document.getElementById("imageInput");

imageInput.onchange = e => {
    files = e.target.files;
    if(!files || !files[0]){
        const fallbackCover = isEditingPlaylist() ? currentMakePlaylistName.getAttribute('data-playlist-banner') : "images/defaultPlaylist.webp";
        imageDownload = fallbackCover || "images/defaultPlaylist.webp";
        document.getElementById("imageUploadView").style.backgroundImage = `url("${imageDownload}")`;
        return;
    }

    let extension = GetFileExt(files[0]);
    let name = GetFileName(files[0]);

    imageFileName = name + extension;

    reader.readAsDataURL(files[0]);

    reader.onload = function () {
        document.getElementById("imageUploadView").style.backgroundImage = `url('`+ this.result +`')`;
    };
}

function GetFileExt(file){
    var temp = file.name.split('.');
    var ext = temp.slice(temp.length-1,temp.length);
    return '.'+ext[0];
}

function GetFileName(file){
    var temp = file.name.split('.');
    var fname = temp.slice(0,-1).join('.');
    return fname;
}

function UploadProcess(){
    return new Promise(resolve => {
        files = imageInput.files;

        if(!files || !files[0]){
            imageDownload = isEditingPlaylist() ? (currentMakePlaylistName.getAttribute('data-playlist-banner') || "images/defaultPlaylist.webp") : "images/defaultPlaylist.webp";
            resolve(true);
            return;
        }

        var ImgToUpload = files[0];
        var ImgName = Date.now() + "-" + (imageFileName || ImgToUpload.name);

        const metaData = {
            contentType: ImgToUpload.type
        }

        const storage = getStorage();
        const storageRef = sRef(storage, "Playlists/"+ImgName);
        const UploadTask = uploadBytesResumable(storageRef, ImgToUpload, metaData);

        UploadTask.on('state-changed', (snapshot)=>{
            let progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setMakePlaylistLoading(true, "Uploading cover " + progress + "%...");
        },
        (error) =>{
            setMakePlaylistLoading(false);
            alert("Image failed to upload! " + error);
            resolve(false);
        },
        ()=>{
            getDownloadURL(UploadTask.snapshot.ref).then((downloadURL)=>{
                imageDownload = downloadURL;
                resolve(true);
            });
        }
        );
    })
}

function GenerateOneSongFromLiked(songName){
    let name = songName;

    playlistSongsList.innerHTML = "";

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songCreator = snapshot.val().Creator;
                songToBePlayed = snapshot.val().SongURL;
                songTitle  = snapshot.val().SongName;
                imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem">
                <div class="songInfo">
                    <div class="songVisualizer">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <img src="`+imageURLSmall+`" alt="songBanner">
                    <div class="songText">
                        <h2>`+ songTitle +`</h2>
                        <h3>`+ songCreator +`</h3>
                    </div>
                </div>
                <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','',this.parentElement,'`+ name +`');"></div>
                <div class="songBtns">
                    <button onclick="openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`',true)"><i class="fa-solid fa-bars"></i></button>
                </div>
            </li>`;
            playlistSongsList.innerHTML += currentLI;
        }
    })
}

export function reloadLikedSongs(){

    let dbRef = ref(realdb);
    let userLiked;

    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            userLiked = snapshot.val().LikedSongs;
            
            if(userLiked === undefined){
                userLiked = "";
            }
        
            const playlistSongss = String(userLiked || "").split(',').filter(Boolean).reverse();
            loadPlaylistSongRows(playlistSongss, "Favorites");
        }
    })
}

export function openLikedSongs(){

    let dbRef = ref(realdb);
    showSkeleton(playlistSongsList, "song", 5);

    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            let userLiked = snapshot.val().LikedSongs;

            if(userLiked != undefined){
                openMyPlaylistPage(0, "Favorites", "images/favoritesPlaylistPage.gif", "0", userLiked);
            }else{
                openMyPlaylistPage(0, "Favorites", "images/favoritesPlaylistPage.gif", "0", "");
            }
        }
    })
}

// ----- LIKE SONGS

export function seeIfSongIsLiked(id){

    const dbRef = ref(realdb);
    const requestedId = String(id);

    if(currentUser != undefined){
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let setUsername = snapshot.val().Username;
                let setEmail = snapshot.val().Email;
                let setPassword = snapshot.val().Password;
                let setPlaylists = snapshot.val().Playlists;
                let setLikedSongs = snapshot.val().LikedSongs;
    
                if(setLikedSongs === undefined){
                    setLikedSongs = "";
                }
                let likedSongsArray = setLikedSongs.split(',').filter(Boolean);
                window.crimsonLikedSongIds = new Set(likedSongsArray.map(String));
    
                const likeSongBtn = document.getElementById("likeSongBtn");
                const playerLikeBtn = document.getElementById("playerLikeBtn");
                const miniPlayerLikeBtn = document.getElementById("miniPlayerLikeBtn");
                const shouldUpdatePopup = likeSongBtn?.getAttribute("data-song-id") === requestedId;
    
                if(likedSongsArray.includes(requestedId)){
                    miniPlayerLikeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                    playerLikeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                    if(shouldUpdatePopup){
                        likeSongBtn.classList.remove("popupItemLoading");
                        likeSongBtn.innerHTML = `<i class="fa-solid fa-heart"></i><h5>Remove from favorites</h5>`;
                    }
                }else{
                    miniPlayerLikeBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                    playerLikeBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                    if(shouldUpdatePopup){
                        likeSongBtn.classList.remove("popupItemLoading");
                        likeSongBtn.innerHTML = `<i class="fa-regular fa-heart"></i><h5>Add to favorites</h5>`;
                    }
                }
            }
        })
    }

    return true;
}

export function addSongToLiked(id, likeBtn){
    const dbRef = ref(realdb);
    const songId = String(id);
        if(currentUser != undefined){

            get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
                if(snapshot.exists()){
                    let setUsername = snapshot.val().Username;
                    let setEmail = snapshot.val().Email;
                    let setPassword = snapshot.val().Password;
                    let setPlaylists = snapshot.val().Playlists;
                    let setProfilePhoto = snapshot.val().ProfilePhoto;
                    let setLikedSongs = snapshot.val().LikedSongs;
                    let setTheme = snapshot.val().AppTheme;
                    let setLikedPlaylists = snapshot.val().LikedPlaylists;
                    let setFollowedArtists = snapshot.val().FollowedArtists;
        
                    if(setFollowedArtists == undefined){
                        setFollowedArtists = "";
                    }
                    if(setLikedSongs == undefined){
                        setLikedSongs = "";
                    }
                    if(setLikedPlaylists === undefined){
                        setLikedPlaylists = "";
                    }
                    let likedSongsArray = setLikedSongs.split(',');
                    if(!likedSongsArray.includes(songId)){
                        window.crimsonLikedSongIds = window.crimsonLikedSongIds || new Set();
                        window.crimsonLikedSongIds.add(songId);
                        update(ref(realdb, "Users/"+currentUser.Username), {LikedSongs: setLikedSongs + songId + ","})
                        .then(()=>{
                            if(likeBtn != undefined){
                                window.crimsonPlayfulBurst?.(likeBtn, "like");
                                likeBtn.classList.add('likeBtnAnim');
                                setTimeout(() => {
                                    likeBtn.classList.remove('likeBtnAnim');
                                }, 400);
                            }
                            const likeSongBtn = document.getElementById("likeSongBtn");
                            const playerLikeBtn = document.getElementById("playerLikeBtn");
                            const miniPlayerLikeBtn = document.getElementById("miniPlayerLikeBtn");
                            likeSongBtn.innerHTML = `<i class="fa-solid fa-heart"></i><h5>Remove from favorites</h5>`;
                            playerLikeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                            miniPlayerLikeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                            reloadLikedSongs();
                        })
                        .catch((error)=>{
                            alert("error "+error);
                        })
                    }else{
                        window.crimsonLikedSongIds = window.crimsonLikedSongIds || new Set();
                        window.crimsonLikedSongIds.delete(songId);
                        likedSongsArray = likedSongsArray.filter(function(item) {
                            return item !== songId;
                        });
        
                        update(ref(realdb, "Users/"+currentUser.Username), {LikedSongs: likedSongsArray.toString()})
                        .then(()=>{
                            if(likeBtn != undefined){
                                window.crimsonPlayfulBurst?.(likeBtn, "unlike");
                                likeBtn.classList.add('likeBtnAnimDel');
                                setTimeout(() => {
                                    likeBtn.classList.remove('likeBtnAnimDel');
                                }, 400);
                            }
                            const likeSongBtn = document.getElementById("likeSongBtn");
                            const playerLikeBtn = document.getElementById("playerLikeBtn");
                            const miniPlayerLikeBtn = document.getElementById("miniPlayerLikeBtn");
                            likeSongBtn.innerHTML = `<i class="fa-regular fa-heart"></i><h5>Add to favorites</h5>`;
                            playerLikeBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                            miniPlayerLikeBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                            reloadLikedSongs();
                        })
                        .catch((error)=>{
                            alert("error "+error);
                        })
                    }
                }
            })
        }else{
            openLoginPopup();
        }
}

// ----- GETTING ARTIST ID FROM NAME

export function getArtistId(artistName){
    let dbRef = ref(realdb);
    
    for (let i = 0; i < brojArtista; i++) {
        get(child(dbRef, "Artists/"+i)).then((snapshot)=>{
            if(snapshot.exists()){
                let artistNameDB = snapshot.val().Artist;
                let artistImage = getArtistImage(snapshot.val(), "large");
            artistImageSmall = getArtistImage(snapshot.val(), "small");
                let artistFollowers = snapshot.val().Followers;
                let artistListens = snapshot.val().Listens;
                let artistAboutImage = getArtistAboutImage(snapshot.val(), "large");
                if(artistName.includes(artistNameDB)){
                    document.getElementById('seeMoreFromBtn').onclick = () => {
                        clickEffect(this); 
                        openArtistPage(i,artistName,artistImage,artistFollowers,artistListens,artistAboutImage);
                        closePopup();
                        closeBigPlayer();
                    };
                }
            }
        })
    }
}

// ----- LOADING USERS PLAYLISTS IN THE POPUP

const popupMyPlaylists = document.querySelector('.popupMyPlaylists');

export function LoadUserPlaylistsPopup(songId){
    popupMyPlaylists.innerHTML = `<li class="popupPlaylistLoading">Loading playlists...</li>`;

    let dbRef = ref(realdb);

    if(currentUser != undefined){
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let usersPlaylists = (snapshot.val().Playlists || "").split('{');
                numberOfPlaylists = usersPlaylists.length - 1;
                const playlistRows = [];
    
                for (let i = numberOfPlaylists; i > 0; i--) {
                    const playlistParts = usersPlaylists[i].split('}');
                    const playlistId = playlistParts[0];
                    const playlistName = playlistParts[1];
                    const playlistBanner = playlistParts[2];
                    const playlistBannerSmall = playlistBanner;
                    const playlistSongs = playlistParts[3] || "";
                    const rowIndex = playlistRows.length;
                    if(!playlistId || !playlistName){
                        continue;
                    }

                    if(playlistSongs.split(',').includes(String(songId))){
                        playlistRows.push(`<li class="songItem popupPlaylistItem" style="--popup-item-index: `+ rowIndex +`" id="`+ playlistId +`">
                            <div class="songInfo">
                                <img src="`+ playlistBannerSmall +`" alt="playlistBanner">
                                <div class="songText">
                                    <h2>`+ playlistName +`</h2>
                                    <h3>`+ "by " + currentUser.Username +`</h3>
                                </div>
                            </div>
                            <div class="songClickDiv" onclick="addSongToThisPlaylist(this.parentElement,`+ songId +`,`+ playlistId +`)"></div>
                            <div class="songBtns greenCheck playlistCanRemove">
                                <button class="playlistAddedMark" onclick="addSongToThisPlaylist(this.parentElement.parentElement,`+ songId +`,`+ playlistId +`)"><i class="fa-solid fa-circle-check checkAnim"></i></button>
                                <button class="playlistRemoveMark" onclick="addSongToThisPlaylist(this.parentElement.parentElement,`+ songId +`,`+ playlistId +`)"><i class="fa-solid fa-xmark checkAnim"></i></button>
                                <div class="greenSidePl"></div>
                            </div>
                        </li>`);
                    }else{
                        playlistRows.push(`<li class="songItem popupPlaylistItem" style="--popup-item-index: `+ rowIndex +`" id="`+ playlistId +`">
                            <div class="songInfo">
                                <img src="`+ playlistBannerSmall +`" alt="playlistBanner">
                                <div class="songText">
                                    <h2>`+ playlistName +`</h2>
                                    <h3>`+ "by " + currentUser.Username +`</h3>
                                </div>
                            </div>
                            <div class="songClickDiv" onclick="addSongToThisPlaylist(this.parentElement,`+ songId +`,`+ playlistId +`)"></div>
                            <div class="songBtns">
                                <button onclick="addSongToThisPlaylist(this.parentElement.parentElement,`+ songId +`,`+ playlistId +`)"><i class="fa-solid fa-plus checkAnim"></i></button>
                                <div class="greenSidePl"></div>
                            </div>
                        </li>`);
                    }
                }

                popupMyPlaylists.innerHTML = playlistRows.length ? playlistRows.join("") : `<li class="popupPlaylistLoading">No playlists yet.</li>`;
            }
        })
    }else{
        
    }
}

// ----- ADDING SONG TO A SPECIFIC PLAYLIST

export function addSongToThisPlaylist(clickedPlaylist, songId, playlistId){
    const actionBtns = clickedPlaylist.children[2];
    const isRemoving = actionBtns.classList.contains('greenCheck');
    const previousHTML = actionBtns.innerHTML;
    const previousClasses = actionBtns.className;

    if(isRemoving){
        actionBtns.innerHTML = '<button onclick="addSongToThisPlaylist(this.parentElement.parentElement,'+ songId +','+ playlistId +')"><i class="fa-solid fa-plus checkAnim"></i></button><div class="greenSidePl"></div>';
        actionBtns.classList.remove('greenCheck', 'playlistCanRemove');
    }else{
        actionBtns.innerHTML = '<button class="playlistAddedMark" onclick="addSongToThisPlaylist(this.parentElement.parentElement,'+ songId +','+ playlistId +')"><i class="fa-solid fa-circle-check checkAnim"></i></button><button class="playlistRemoveMark" onclick="addSongToThisPlaylist(this.parentElement.parentElement,'+ songId +','+ playlistId +')"><i class="fa-solid fa-xmark checkAnim"></i></button><div class="greenSidePl"></div>';
        actionBtns.classList.add('greenCheck', 'playlistCanRemove');
    }

    let dbRef = ref(realdb);

    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            let setUsername = snapshot.val().Username;
            let setEmail = snapshot.val().Email;
            let setPassword = snapshot.val().Password;
            let setPlaylists = snapshot.val().Playlists;
            let setLikedSongs = snapshot.val().LikedSongs;
            let setTheme = snapshot.val().AppTheme;
            let setProfilePhoto = snapshot.val().ProfilePhoto;
            let setLikedPlaylists = snapshot.val().LikedPlaylists;
            let setFollowedArtists = snapshot.val().FollowedArtists;
            if(setFollowedArtists == undefined){
                setFollowedArtists = "";
            }
            if(setLikedSongs == undefined){
                setLikedSongs = "";
            }
            if(setLikedPlaylists == undefined){
                setLikedPlaylists = "";
            }
            if(setPlaylists == undefined){
                setPlaylists = "";
            }

            const songIdString = String(songId);
            const playlistIdString = String(playlistId);
            const usersPlaylists = setPlaylists.split('{');
            const newSetPlaylists = usersPlaylists.map((playlistString) => {
                const playlistParts = playlistString.split('}');
                if(playlistParts[0] !== playlistIdString || playlistParts.length < 4){
                    return playlistString;
                }

                const playlistSongs = (playlistParts[3] || "").split(',').filter(Boolean);
                const nextSongs = isRemoving
                    ? playlistSongs.filter((item) => item !== songIdString)
                    : playlistSongs.includes(songIdString) ? playlistSongs : playlistSongs.concat(songIdString);

                return playlistParts[0] + "}" + playlistParts[1] + "}" + playlistParts[2] + "}" + nextSongs.join(',') + "}";
            }).join('{');

            update(ref(realdb, "Users/"+currentUser.Username), {Playlists: newSetPlaylists})
            .then(()=>{
                LoadUserPlaylists();
            })
            .catch((error)=>{
                actionBtns.innerHTML = previousHTML;
                actionBtns.className = previousClasses;
                alert("error "+error);
            })
        }
    })
}

// ----- PLAYER LYRICS

export function turnLyrics(songId){
    isLyricsOn = true;
    if(typeof window.openPlayerPopup === "function"){
        window.openPlayerPopup("lyrics");
    }
    if(typeof window.crimsonLoadLyricsIntoPlayerPopup === "function"){
        window.crimsonLoadLyricsIntoPlayerPopup(songId);
    }
}

export function doesSongHaveLyrics(songId, playedFrom){
    const playerLyricsBtn = document.getElementById('playerLyricsBtn');

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+songId)).then((snapshot)=>{
        if(snapshot.exists()){
            let LYRICS = snapshot.val().Lyrics;
            if(LYRICS == undefined || LYRICS == ""){
                playerLyricsBtn.classList.add("disabledBtn");
                if(isLyricsOn){
                    closePlayerLyrics2(playedFrom);
                }
            }else{
                playerLyricsBtn.classList.remove("disabledBtn");
                if(isLyricsOn){
                    window.crimsonLoadLyricsIntoPlayerPopup(songId);
                }
            }
        }
    })
}

export function closePlayerLyrics(previousPBH2text, previousPBBonclick){
    if(isLyricsOn){
        if(typeof window.closePlayerPopup === "function"){
            window.closePlayerPopup();
        }
        isLyricsOn = false;
    }
}

function closePlayerLyrics2(playedFrom){
    if(isLyricsOn){
        if(typeof window.closePlayerPopup === "function"){
            window.closePlayerPopup();
        }
        isLyricsOn = false;
    }
}

// ----- THIS MONTHS FEATURE

function generateThisMonthsFeature(){
    let dbRef = ref(realdb);

    get(child(dbRef, "HomeFeatures/ThisMonthsArtist")).then((snapshot)=>{
        if(snapshot.exists()){
            let setArtistId = snapshot.val().ArtistId;
            let setSongId = snapshot.val().SongId;
            let setMonth = snapshot.val().Month;

            document.getElementsByClassName('thisMFSection')[0].innerHTML = `
            <h2 class="catTitle">This Months Feature</h2>
            <div class="thisMFDiv">
                <img onload="buttonClickAnim(this.parentElement)" id="artistMFBanner" src="images/CrimsonLogo.png" alt="artistFeatureBanner">
                <div id="MFArtistInfo">
                    
                </div>
            </div>
            `;

            get(child(dbRef, "Artists/"+setArtistId)).then((snapshot)=>{
                if(snapshot.exists()){
                    let artistName = snapshot.val().Artist;
                    let artistImage = getArtistImage(snapshot.val(), "large");
            artistImageSmall = getArtistImage(snapshot.val(), "small");
                    let artistFollowers = snapshot.val().Followers;
                    let artistListens = snapshot.val().Listens;
                    let artistAboutImage = getArtistAboutImage(snapshot.val(), "large");

                    document.querySelector('.thisMFDiv').addEventListener('click', () => {
                        openArtistPage(setArtistId, artistName, artistImage, artistFollowers, artistListens , artistAboutImage);
                    })
                    document.querySelector('.thisMFDiv').setAttribute('data-crimson-context', encodeContextPayload({
                        type: "artist",
                        id: setArtistId,
                        name: artistName,
                        image: artistImage,
                        imageSmall: artistImageSmall,
                        followers: artistFollowers,
                        listens: artistListens,
                        aboutImage: artistAboutImage
                    }));

                    document.getElementById('artistMFBanner').src = artistImage;
                    document.getElementById('MFArtistInfo').innerHTML += `
                        <h2 id="MFArtistName">${artistName}</h2>
                        <h5 id="MFArtistFollowers">${artistFollowers + "&nbsp;Followers"}</h5>
                        <button onclick="clickEffect(this)">View Profile</button>
                        `;
                }
            })
        }
    })
}

// ----- DELETE PLAYLIST

const deletePlaylistBtn = document.getElementById('deletePlaylistBtn');
deletePlaylistBtn.addEventListener('click', () => {

    const playlistId = deletePlaylistBtn.getAttribute('data-playlist-id');
    const playlistNameP = deletePlaylistBtn.getAttribute('data-playlist-name');
    let newSetPlaylists = "";

    if (confirm(`Are you sure you want to delete: ${playlistNameP}?`) == true) {
        let dbRef = ref(realdb);

        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let setUsername = snapshot.val().Username;
                let setEmail = snapshot.val().Email;
                let setLikedSongs = snapshot.val().LikedSongs;
                let setPassword = snapshot.val().Password;
                let setPlaylists = snapshot.val().Playlists;
                let setProfilePhoto = snapshot.val().ProfilePhoto;
                let setTheme = snapshot.val().AppTheme;
                let setFollowedArtists = snapshot.val().FollowedArtists;
                let setLikedPlaylists = snapshot.val().LikedPlaylists;
                setFollowedArtists = snapshot.val().FollowedArtists;
                if(setFollowedArtists == undefined){
                    setFollowedArtists = "";
                }
                if(setLikedSongs == undefined){
                    setLikedSongs = "";
                }
                if(setLikedPlaylists == undefined){
                    setLikedPlaylists = "";
                }
                if(setPlaylists == undefined){
                    setPlaylists = "";
                }

                let usersPlaylists = setPlaylists.split('{');

                for (let i = 0; i < usersPlaylists.length; i++) {
                    if(usersPlaylists[i].split('}')[0] != playlistId){
                        if(i == (usersPlaylists.length-1)){
                            newSetPlaylists += usersPlaylists[i];
                        }else{
                            newSetPlaylists += usersPlaylists[i] + "{";
                        }
                    }
                }

                newSetPlaylists = newSetPlaylists.slice(0, -1);

                update(ref(realdb, "Users/"+currentUser.Username), {Playlists: newSetPlaylists})
                .then(()=>{
                    LoadUserPlaylists();
                })
                .catch((error)=>{
                    alert("error "+error);
                })
            }
        })
    } else {
        
    }
})

// ----- EDIT PLAYLIST

const editPlaylistBtn = document.getElementById('editPlaylistBtn');
editPlaylistBtn.addEventListener('click', () => {

    const playlistIdP = editPlaylistBtn.getAttribute('data-playlist-id');
    const playlistNameP = editPlaylistBtn.getAttribute('data-playlist-name');
    const playlistBannerP = editPlaylistBtn.getAttribute('data-playlist-banner');
    const playlistSongsP = editPlaylistBtn.getAttribute('data-playlist-songs');
    let newSetPlaylists = "";

    closePopup();
    OpenMakePlaylistScreen(true, playlistIdP, playlistNameP, playlistBannerP, playlistSongsP);
})

const saveAccountBtn = document.getElementById('saveAccount');
saveAccountBtn .addEventListener('click', async (e) => {
    e.preventDefault();

    let dbRef = ref(realdb);

    get(child(dbRef, "Users/"+currentUser.Username)).then(async (snapshot)=>{
        if(snapshot.exists()){
            let setUsername = snapshot.val().Username;
            let setEmail = snapshot.val().Email;
            let setLikedSongs = snapshot.val().LikedSongs;
            let setPassword = snapshot.val().Password;
            let setPlaylists = snapshot.val().Playlists;
            let setProfilePhoto = snapshot.val().ProfilePhoto;
            let setTheme = snapshot.val().AppTheme;
            let setFollowedArtists = snapshot.val().FollowedArtists;
            let setLikedPlaylists = snapshot.val().LikedPlaylists;
            setFollowedArtists = snapshot.val().FollowedArtists;
            if(setFollowedArtists == undefined){
                setFollowedArtists = "";
            }
            if(setLikedSongs == undefined){
                setLikedSongs = "";
            }
            if(setLikedPlaylists == undefined){
                setLikedPlaylists = "";
            }
            if(setPlaylists == undefined){
                setPlaylists = "";
            }

            const editablePhoto = document.querySelector('.accPhotoWrapper').children[0];
            let newProfilePhoto = editablePhoto.getAttribute('data-photo-id');

            if(editablePhoto.getAttribute('data-photo-upload') === 'true'){
                saveAccountBtn.value = "Uploading...";
                saveAccountBtn.classList.add('disabledBtn');
                const uploadedPhotoUrl = await uploadProfilePhoto(selectedProfilePhotoFile);
                saveAccountBtn.value = "Save";
                saveAccountBtn.classList.remove('disabledBtn');

                if(!uploadedPhotoUrl){
                    return;
                }

                newProfilePhoto = uploadedPhotoUrl;
                selectedProfilePhotoFile = null;
                if(profilePhotoUpload){
                    profilePhotoUpload.value = "";
                }
            }else if(newProfilePhoto == undefined || newProfilePhoto == null){
                newProfilePhoto = editablePhoto.getAttribute('data-photo-url');
            }

            if(newProfilePhoto == undefined || newProfilePhoto == null){
                newProfilePhoto = setProfilePhoto;
            }

            update(ref(realdb, "Users/"+currentUser.Username), {ProfilePhoto: newProfilePhoto})
            .then(()=>{
                alert("Successfully saved the profile!");
                editablePhoto.setAttribute('data-photo-url', newProfilePhoto);
                editablePhoto.removeAttribute('data-photo-id');
                editablePhoto.removeAttribute('data-photo-upload');
                reloadUserPhotoAndUsername();
            })
            .catch((error)=>{
                alert("error "+error);
            })
        }
    })
})

// ----- BUG REPORTING

const bugReportForm = document.querySelector('.bugReportForm');
const bugDescriptionInput = document.getElementById('bugDescription');
const bugDescriptionCount = document.getElementById('bugDescriptionCount');

bugDescriptionInput?.addEventListener('input', () => {
    if(bugDescriptionCount){
        bugDescriptionCount.textContent = bugDescriptionInput.value.length;
    }
});

bugReportForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const bugSubjectInput = document.getElementById('bugSubject');
    const submitButton = bugReportForm.querySelector('.bugSubmitButton');
    const bugSubject = bugSubjectInput.value.trim();
    const bugDescription = bugDescriptionInput.value.trim();

    if(!currentUser?.Username){
        window.showCrimsonNotice?.('Sign in before sending a bug report.', 'warning');
        window.setAuthGatewayVisible?.(true, 'login');
        return;
    }
    if(bugSubject.length < 4){
        window.showCrimsonNotice?.('Give the issue a short, specific title.', 'warning');
        bugSubjectInput.focus();
        return;
    }
    if(bugDescription.length < 10){
        window.showCrimsonNotice?.('Add a little more detail so we can reproduce the issue.', 'warning');
        bugDescriptionInput.focus();
        return;
    }

    submitButton.disabled = true;
    submitButton.querySelector('span').textContent = 'Sending...';

    try{
        const reportRoot = ref(realdb, "BugReports/"+currentUser.Username);
        const snapshot = await get(reportRoot);
        const oldReports = String(snapshot.val()?.Bugs || "");
        const reportNumber = (oldReports.match(/\{/g) || []).length + 1;
        let legacyReports = oldReports + "{" + reportNumber + "}" + bugSubject + "}" + bugDescription + "}";
        if(legacyReports.length > 10000){
            legacyReports = "{" + reportNumber + "}" + bugSubject + "}" + bugDescription + "}";
        }

        const reportId = Date.now();
        await update(reportRoot, {
            Bugs: legacyReports,
            [`Reports/${reportId}`]: {
                Subject: bugSubject,
                Description: bugDescription,
                CreatedAt: new Date(reportId).toISOString(),
                AppVersion: "0.2.7"
            }
        });

        bugReportForm.reset();
        if(bugDescriptionCount){
            bugDescriptionCount.textContent = '0';
        }
        window.showCrimsonNotice?.('Bug report sent. Thank you for helping us improve Crimson!', 'success', {title: 'Report received'});
    }catch(error){
        window.showCrimsonNotice?.('Your report could not be sent. Please try again.', 'error');
        console.error(error);
    }finally{
        submitButton.disabled = false;
        submitButton.querySelector('span').textContent = 'Send report';
    }
});

// ----- APP LOADING

async function loadApp(){
    showSkeleton(recSongs, "song", 5);
    showSkeleton(recArtists, "artist", 6);
    showSkeleton(recPlaylists, "playlist", 4, true);
    showSkeleton(categoriesList, "category", 10);

    let result = await loadAppNumbers();

    document.querySelector('.loaderWrapper')?.classList.add('loaderOff');

    generateSongs();
    generateArtists();
    generatePlaylists();
    generateCategories();
    generateThisMonthsFeature();
    RegToLog();
    // Removing the loader after init
    // document.querySelector('.loaderWrapper').classList.add('displayNone');

    LoadUserPlaylists();
    LoadLikedPlaylists();
    LoadUserFArtists();
}

// ----- CALLING ALL NECESSARY FUNCTIONS

getUsername();
seeIfUserIsSignedIn();
loadApp();
