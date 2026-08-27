window.currentUser = null;


/* ========================================
   📚 책 데이터
======================================== */

const books = [
    {
        id: "human-disqualification",
        title: "인간 실격",
        author: "다자이 오사무",
        image: "images/ingans.jpg"
    },
    {
        id: "demian",
        title: "데미안",
        author: "헤르만 헤세",
        image: "images/demi.jpg"
    },
    {
        id: "little-prince",
        title: "어린 왕자",
        author: "앙투안 드 생텍쥐페리",
        image: "images/youngwangja.jpg"
    },
    {
        id: "old-man-and-sea",
        title: "노인과 바다",
        author: "어니스트 헤밍웨이",
        image: "images/noin.jpg"
    },
    {
        id: "1984",
        title: "1984",
        author: "조지 오웰",
        image: "images/1984.jpg"
    }
];


/* ========================================
   HTML 보호
======================================== */

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
}


/* ========================================
   사용자 ID
======================================== */

function getUserId() {
    let userId = localStorage.getItem("bookbang_user_id");

    if (!userId) {
        if (window.crypto && crypto.randomUUID) {
            userId = crypto.randomUUID();
        } else {
            userId =
                Date.now().toString(36) +
                Math.random().toString(36).substring(2);
        }

        localStorage.setItem(
            "bookbang_user_id",
            userId
        );
    }

    return userId;
}


/* ========================================
   현재 책
======================================== */

function getCurrentBook() {
    const params =
        new URLSearchParams(window.location.search);

    const bookId = params.get("book");

    if (!bookId) {
        return null;
    }

    return (
        books.find(book => book.id === bookId) ||
        null
    );
}


/* ========================================
   홈 화면
======================================== */

function renderBooks() {
    const bookList =
        document.getElementById("bookList");

    if (!bookList) {
        return;
    }

    const bookCount =
        document.getElementById("bookCount");

    if (bookCount) {
        bookCount.textContent =
            `${books.length}권`;
    }

    bookList.innerHTML =
        books.map(book => `
            <article class="book-card">

                <div class="book-cover">
                    <img
                        src="${book.image}"
                        alt="${escapeHTML(book.title)} 책 표지"
                        loading="lazy"
                    >
                </div>

                <h3>
                    ${escapeHTML(book.title)}
                </h3>

                <p class="book-author">
                    ${escapeHTML(book.author)}
                </p>

                <button
                    type="button"
                    class="book-enter-button"
                    data-book-id="${escapeHTML(book.id)}"
                >
                    채팅방 입장
                </button>

            </article>
        `).join("");

    document
        .querySelectorAll(".book-enter-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const bookId =
                        button.dataset.bookId;

                    location.href =
                        `chat.html?book=${encodeURIComponent(bookId)}`;

                }
            );

        });
}


/* ========================================
   채팅방 정보
======================================== */

function renderChatRoom() {
    const messages =
        document.getElementById("messages");

    if (!messages) {
        return;
    }

    const book = getCurrentBook();

    const title =
        document.getElementById("chatBookTitle");

    const author =
        document.getElementById("chatBookAuthor");

    const cover =
        document.getElementById("chatBookCover");


    if (!book) {

        if (title) {
            title.textContent =
                "책을 찾을 수 없습니다.";
        }

        if (author) {
            author.textContent = "";
        }

        return;
    }


    document.title =
        `${book.title} - 책방`;


    if (title) {
        title.textContent =
            book.title;
    }


    if (author) {
        author.textContent =
            book.author;
    }


    if (cover) {

        cover.innerHTML = `
            <img
                src="${book.image}"
                alt="${escapeHTML(book.title)} 책 표지"
            >
        `;

    }
}


/* ========================================
   메시지 표시 닉네임
======================================== */
function renderMessage(message) {

    const messages =
        document.getElementById("messages");

    if (!messages || !message) {
        return;
    }


    // 중복 메시지 방지

    if (message.id) {

        const exists =
            messages.querySelector(
                `[data-message-id="${message.id}"]`
            );

        if (exists) {
            return;
        }
    }


    // 현재 로그인한 사용자 정보

    const currentUser =
        window.currentUser || null;

    const myNickname =
        currentUser?.nickname || "";


    // 내 메시지인지 확인

    const isMine =
        myNickname &&
        String(message.nickname) ===
        String(myNickname);


    // 메시지 전체

    const element =
        document.createElement("div");

    element.className =
        isMine
            ? "message mine"
            : "message other";


    if (message.id) {

        element.dataset.messageId =
            message.id;

    }


    // 상대방 닉네임

    if (!isMine) {

        const nickname =
            document.createElement("div");

        nickname.className =
            "message-nickname";

        nickname.textContent =
            message.nickname || "사용자";

        element.appendChild(
            nickname
        );
    }


    // 말풍선

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent =
        message.content || "";


    element.appendChild(
        bubble
    );


    messages.appendChild(
        element
    );
}


/* ========================================
   DB 메시지 불러오기
======================================== */

async function loadMessages() {

    const messages =
        document.getElementById("messages");

    if (!messages) {
        return;
    }


    const book =
        getCurrentBook();

    if (!book) {
        return;
    }


    messages.innerHTML = `
        <div class="chat-loading">
            채팅을 불러오는 중...
        </div>
    `;


    try {

        const response =
            await fetch(
                `/api/messages/${encodeURIComponent(book.id)}`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `서버 오류 (${response.status})`
            );

        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.error ||
                "메시지를 불러오지 못했습니다."
            );

        }


        messages.innerHTML = "";


        const messageList =
            Array.isArray(result.messages)
                ? result.messages
                : [];


        messageList.forEach(
            message => {
                renderMessage(message);
            }
        );


        messages.scrollTop =
            messages.scrollHeight;


    } catch (error) {

        console.error(
            "❌ 메시지 불러오기 오류:",
            error
        );


        messages.innerHTML = `
            <div class="chat-error">
                채팅을 불러오지 못했습니다.
            </div>
        `;

    }
}


/* ========================================
   메시지 전송
======================================== */

async function sendMessage() {

    const input =
        document.getElementById(
            "messageInput"
        );

    const messages =
        document.getElementById(
            "messages"
        );


    if (!input || !messages) {
        return;
    }


    const text =
        input.value.trim();


    if (!text) {
        return;
    }


    if (text.length > 500) {

        alert(
            "메시지는 500자 이하로 입력해주세요."
        );

        return;
    }


    const book =
        getCurrentBook();


    if (!book) {
        alert(
            "책방 정보를 찾을 수 없습니다."
        );

        return;
    }


    const userId =
        getUserId();


    /* 중복 전송 방지 */

    if (input.disabled) {
        return;
    }


    input.disabled = true;


    try {

       


const response =
    await fetch(
        "/api/messages",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                book_id: book.id,
                content: text
            })
        }
    );

        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                `서버 오류 (${response.status})`
            );

        }


        if (!result.success) {

            throw new Error(
                result.error ||
                "메시지를 전송하지 못했습니다."
            );

        }


        /* DB 저장 성공 후 화면 표시 */

        if (result.message) {

            renderMessage(
                result.message
            );

        }


        input.value = "";


        messages.scrollTop =
            messages.scrollHeight;


    } catch (error) {

        console.error(
            "❌ 메시지 전송 오류:",
            error
        );


        /*
            사용자에게 실제 서버 오류를
            확인할 수 있도록 표시
        */

        alert(
            `메시지를 전송하지 못했습니다.\n\n${error.message}`
        );

    } finally {

        input.disabled = false;

        input.focus();

    }
}


/* ========================================
   채팅 이벤트
======================================== */

function setupChat() {

    const form =
        document.getElementById(
            "chatForm"
        );

    const input =
        document.getElementById(
            "messageInput"
        );


    if (!form || !input) {
        return;
    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            sendMessage();

        }
    );


    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );
}


/* ========================================
   페이지 시작
======================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

   renderBooks();

renderChatRoom();

setupChat();

await loadCurrentUser();

const messages =
    document.getElementById("messages");

        if (messages) {

            await loadMessages();

         

        }

    }
);
// ========================================
// 🔴 Supabase Realtime
// ========================================

async function setupRealtimeChat() {

    const messages =
        document.getElementById("messages");

    if (!messages) {
        return;
    }

    const book =
        getCurrentBook();

    if (!book) {
        return;
    }

    try {

        const response =
            await fetch("/api/realtime-config");

        if (!response.ok) {
            throw new Error(
                "Realtime 설정을 가져오지 못했습니다."
            );
        }

        const config =
            await response.json();

        if (
            !window.supabase ||
            !config.url ||
            !config.key
        ) {
            throw new Error(
                "Supabase 설정이 없습니다."
            );
        }

        const realtimeClient =
            window.supabase.createClient(
                config.url,
                config.key
            );


        const channel =
            realtimeClient
                .channel(`book-chat-${book.id}`)

                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "messages",
                        filter:
                            `book_id=eq.${book.id}`
                    },

                    payload => {

                        const message =
                            payload.new;

                        /*
                            내가 보낸 메시지는
                            sendMessage()에서 이미 표시했으므로
                            다시 표시하지 않음
                        */

                        if (
                            String(message.nickname) ===
                            String(getUserId())
                        ) {
                            return;
                        }

                        renderMessage(message);

                        messages.scrollTop =
                            messages.scrollHeight;

                    }
                )

                .subscribe(status => {

                    console.log(
                        "📡 Realtime:",
                        status
                    );

                });


        /*
            페이지를 나가면 연결 정리
        */

        window.addEventListener(
            "beforeunload",
            () => {

                realtimeClient.removeChannel(
                    channel
                );

            }
        );


    } catch (error) {

        console.error(
            "❌ Realtime 연결 오류:",
            error
        );

    }

}
async function loadCurrentUser() {

    try {

        const response =
            await fetch(
                "/api/auth/me",
                {
                    credentials: "include",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            console.log(
                "로그인된 사용자가 없습니다."
            );

            return null;
        }


        const result =
            await response.json();


        if (
            !result.success ||
            !result.user
        ) {

            return null;
        }


        window.currentUser =
            result.user;


        console.log(
            "✅ 현재 사용자:",
            result.user.nickname
        );


        return result.user;


    } catch (error) {

        console.error(
            "❌ 사용자 정보 오류:",
            error
        );

        return null;
    }
   /* ========================================
   HEADER 로그인 상태
======================================== */

async function updateHeaderLogin() {

    const loginButton =
        document.getElementById("headerLogin");

    if (!loginButton) {
        return;
    }

    try {

        const response =
            await fetch("/api/auth/me", {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store"
            });

        if (!response.ok) {
            loginButton.textContent = "로그인";
            loginButton.href = "login.html";
            return;
        }

        const result =
            await response.json();

        /* 로그인 상태 */

        if (
            result.success &&
            result.user
        ) {

            loginButton.textContent =
                `${result.user.nickname}님`;

            /*
               로그인한 상태에서는
               프로필 페이지로 연결할 수 있음.
               아직 프로필 페이지가 없다면
               일단 로그인 페이지로 유지.
            */

            loginButton.href = "login.html";

        }

        /* 로그인하지 않은 상태 */

        else {

            loginButton.textContent =
                "로그인";

            loginButton.href =
                "login.html";

        }

    }

    catch (error) {

        console.error(
            "❌ 헤더 로그인 상태 확인 오류:",
            error
        );

        loginButton.textContent =
            "로그인";

        loginButton.href =
            "login.html";

    }

}


/* ========================================
   시작
======================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /*
           기존 책 목록 불러오기
        */
        // 기존에 있던 코드가 있다면
        // 그대로 유지하면 됨.


        /*
           헤더 로그인 상태 확인
        */
        await updateHeaderLogin();

    }
);
}
