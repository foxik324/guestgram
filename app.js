const socket = io("https://foxik324.github.io/guestgram/");

let currentUser = null;
let selectedUser = null;
let users = [];


/* =========================
   ELEMENTS
========================= */

const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");

const usernameInput =
    document.getElementById("usernameInput");

const loginButton =
    document.getElementById("loginButton");

const loginError =
    document.getElementById("loginError");

const usersList =
    document.getElementById("usersList");

const searchInput =
    document.getElementById("searchInput");

const emptyChat =
    document.getElementById("emptyChat");

const chatWindow =
    document.getElementById("chatWindow");

const chatName =
    document.getElementById("chatName");

const chatStatus =
    document.getElementById("chatStatus");

const chatAvatar =
    document.getElementById("chatAvatar");

const messages =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const profileButton =
    document.getElementById("profileButton");

const profileModal =
    document.getElementById("profileModal");

const closeProfile =
    document.getElementById("closeProfile");

const profileName =
    document.getElementById("profileName");

const profileAvatar =
    document.getElementById("profileAvatar");

const profileBio =
    document.getElementById("profileBio");

const profileAvatarPreview =
    document.getElementById("profileAvatarPreview");

const saveProfile =
    document.getElementById("saveProfile");


/* =========================
   LOGIN
========================= */

loginButton.addEventListener("click", login);

usernameInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        login();
    }
});

function login() {

    const username =
        usernameInput.value.trim();

    loginError.textContent = "";

    if (!username) {
        loginError.textContent =
            "Введите юзернейм";
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Вход...";

    socket.emit(
        "login",
        { username },
        result => {

            loginButton.disabled = false;
            loginButton.textContent = "Войти";

            if (!result.success) {

                loginError.textContent =
                    result.error;

                return;
            }

            currentUser = result.user;

            loginScreen.classList.add("hidden");
            app.classList.remove("hidden");

            updateMyProfile();

            loadUsers();
        }
    );
}


/* =========================
   USERS
========================= */

function loadUsers() {

    fetch("/users")
        .then(response => response.json())
        .then(data => {

            users = data;

            renderUsers();

        })
        .catch(() => {

            console.log(
                "Не удалось загрузить пользователей"
            );

        });
}


function renderUsers() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    usersList.innerHTML = "";

    users
        .filter(user => user.username !== currentUser.username)
        .filter(user => {

            if (!search) {
                return true;
            }

            return (
                user.username
                    .toLowerCase()
                    .includes(search) ||

                user.name
                    .toLowerCase()
                    .includes(search)
            );

        })
        .forEach(user => {

            const element =
                document.createElement("div");

            element.className = "user";

            if (
                selectedUser &&
                selectedUser.username === user.username
            ) {
                element.classList.add("active");
            }

            element.innerHTML = `
                <div class="avatar">
                    ${
                        user.avatar
                            ? `<img src="${escapeAttribute(user.avatar)}">`
                            : escapeHTML(
                                user.name
                                    .charAt(0)
                                    .toUpperCase()
                            )
                    }
                </div>

                <div class="user-info">
                    <strong>
                        ${escapeHTML(user.name)}
                    </strong>

                    <span>
                        @${escapeHTML(user.username)}
                    </span>
                </div>

                ${
                    user.online
                        ? `<div class="online"></div>`
                        : ""
                }
            `;

            element.addEventListener(
                "click",
                () => openChat(user)
            );

            usersList.appendChild(element);
        });
}


searchInput.addEventListener(
    "input",
    renderUsers
);


/* =========================
   CHAT
========================= */

function openChat(user) {

    selectedUser = user;

    emptyChat.classList.add("hidden");
    chatWindow.classList.remove("hidden");

    app.classList.add("chat-open");

    chatName.textContent = user.name;

    updateChatAvatar(user);

    updateChatStatus(user);

    renderUsers();

    loadMessages(user);
}


function updateChatAvatar(user) {

    if (user.avatar) {

        chatAvatar.innerHTML =
            `<img src="${escapeAttribute(user.avatar)}">`;

    } else {

        chatAvatar.textContent =
            user.name.charAt(0).toUpperCase();

    }
}


function updateChatStatus(user) {

    if (user.online) {

        chatStatus.textContent = "онлайн";
        chatStatus.classList.add(
            "online-status"
        );

    } else {

        chatStatus.textContent = "оффлайн";
        chatStatus.classList.remove(
            "online-status"
        );
    }
}


function loadMessages(user) {

    socket.emit(
        "messages:get",
        {
            withUser: user.username
        },
        result => {

            if (!result.success) {
                return;
            }

            messages.innerHTML = "";

            result.messages.forEach(
                addMessage
            );

            scrollMessages();
        }
    );
}


function addMessage(message) {

    if (!selectedUser) {
        return;
    }

    const belongsToCurrentChat =
        (
            message.from === currentUser.username &&
            message.to === selectedUser.username
        ) ||
        (
            message.from === selectedUser.username &&
            message.to === currentUser.username
        );

    if (!belongsToCurrentChat) {
        return;
    }

    const element =
        document.createElement("div");

    const mine =
        message.from === currentUser.username;

    element.className =
        mine
            ? "message mine"
            : "message theirs";

    const date =
        new Date(message.time);

    const time =
        date.toLocaleTimeString(
            "ru-RU",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    element.innerHTML = `
        <div>
            ${escapeHTML(message.text)}
        </div>

        <div class="message-time">
            ${time}
        </div>
    `;

    messages.appendChild(element);

    scrollMessages();
}


function sendMessage() {

    const text =
        messageInput.value.trim();

    if (!text || !selectedUser) {
        return;
    }

    sendButton.disabled = true;

    socket.emit(
        "message:send",
        {
            to: selectedUser.username,
            text
        },
        result => {

            sendButton.disabled = false;

            if (!result.success) {

                alert(result.error);

                return;
            }

            messageInput.value = "";

            messageInput.focus();
        }
    );
}


sendButton.addEventListener(
    "click",
    sendMessage
);

messageInput.addEventListener(
    "keydown",
    e => {

        if (
            e.key === "Enter" &&
            !e.shiftKey
        ) {

            e.preventDefault();

            sendMessage();
        }
    }
);


/* =========================
   NEW MESSAGE
========================= */

socket.on(
    "message:new",
    message => {

        addMessage(message);

        /*
            Если сообщение пришло от другого
            пользователя — обновляем список.
        */

        loadUsers();
    }
);


/* =========================
   USERS UPDATE
========================= */

socket.on(
    "users:update",
    updatedUsers => {

        users = updatedUsers;

        renderUsers();

        if (selectedUser) {

            const updated =
                users.find(
                    user =>
                        user.username ===
                        selectedUser.username
                );

            if (updated) {

                selectedUser = updated;

                chatName.textContent =
                    updated.name;

                updateChatAvatar(updated);
                updateChatStatus(updated);
            }
        }

        updateMyProfile();
    }
);


/* =========================
   PROFILE
========================= */

profileButton.addEventListener(
    "click",
    () => {

        profileName.value =
            currentUser.name;

        profileAvatar.value =
            currentUser.avatar || "";

        profileBio.value =
            currentUser.bio || "";

        updateProfilePreview();

        profileModal.classList.remove(
            "hidden"
        );
    }
);


closeProfile.addEventListener(
    "click",
    () => {

        profileModal.classList.add(
            "hidden"
        );

    }
);


profileModal.addEventListener(
    "click",
    e => {

        if (e.target === profileModal) {

            profileModal.classList.add(
                "hidden"
            );
        }

    }
);


profileAvatar.addEventListener(
    "input",
    updateProfilePreview
);


function updateProfilePreview() {

    const avatar =
        profileAvatar.value.trim();

    if (avatar) {

        profileAvatarPreview.innerHTML =
            `<img src="${escapeAttribute(avatar)}">`;

    } else {

        const name =
            profileName.value.trim() ||
            currentUser?.username ||
            "G";

        profileAvatarPreview.textContent =
            name.charAt(0).toUpperCase();
    }
}


saveProfile.addEventListener(
    "click",
    () => {

        socket.emit(
            "profile:update",
            {
                name: profileName.value,
                avatar: profileAvatar.value,
                bio: profileBio.value
            },
            result => {

                if (!result.success) {

                    alert(result.error);

                    return;
                }

                currentUser =
                    result.user;

                updateMyProfile();

                profileModal.classList.add(
                    "hidden"
                );

                loadUsers();
            }
        );

    }
);


function updateMyProfile() {

    if (!currentUser) {
        return;
    }

    document.getElementById(
        "myName"
    ).textContent =
        currentUser.name;

    document.getElementById(
        "myUsername"
    ).textContent =
        "@" + currentUser.username;

    const avatar =
        document.getElementById(
            "myAvatar"
        );

    if (currentUser.avatar) {

        avatar.innerHTML =
            `<img src="${escapeAttribute(currentUser.avatar)}">`;

    } else {

        avatar.textContent =
            currentUser.name
                .charAt(0)
                .toUpperCase();
    }
}


/* =========================
   HELPERS
========================= */

function scrollMessages() {

    messages.scrollTop =
        messages.scrollHeight;
}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {

    return escapeHTML(value);
}