
/* ========================================
   📚 책방 로그인 / 회원가입
   서버 인증 방식
======================================== */


/* ========================================
   메시지
======================================== */

function showMessage(message, isError = false) {

    const element =
        document.getElementById("authMessage");

    if (!element) {
        return;
    }

    element.textContent = message;

    element.classList.toggle(
        "error",
        isError
    );

}


/* ========================================
   로그인 / 회원가입 화면 전환
======================================== */

function setupAuthToggle() {

    const loginForm =
        document.getElementById("loginForm");

    const signupForm =
        document.getElementById("signupForm");

    const title =
        document.getElementById("authTitle");

    const description =
        document.getElementById("authDescription");

    const toggle =
        document.getElementById("toggleAuth");


    if (
        !loginForm ||
        !signupForm ||
        !toggle
    ) {
        return;
    }


    toggle.addEventListener(
        "click",
        () => {

            const signupVisible =
                signupForm.style.display !== "none";


            /* ================================
               회원가입 → 로그인
            ================================= */

            if (signupVisible) {

                signupForm.style.display =
                    "none";

                loginForm.style.display =
                    "flex";


                if (title) {

                    title.textContent =
                        "책방에 들어오세요";

                }


                if (description) {

                    description.textContent =
                        "로그인하고 사람들과 책 이야기를 나눠보세요.";

                }


                toggle.textContent =
                    "계정이 없으신가요? 회원가입";

            }


            /* ================================
               로그인 → 회원가입
            ================================= */

            else {

                loginForm.style.display =
                    "none";

                signupForm.style.display =
                    "flex";


                if (title) {

                    title.textContent =
                        "책방 계정 만들기";

                }


                if (description) {

                    description.textContent =
                        "닉네임을 정하고 책방에 참여해보세요.";

                }


                toggle.textContent =
                    "이미 계정이 있으신가요? 로그인";

            }


            showMessage("");

        }
    );

}


/* ========================================
   회원가입
======================================== */

async function signup() {

    const emailInput =
        document.getElementById("signupEmail");

    const passwordInput =
        document.getElementById("signupPassword");

    const nicknameInput =
        document.getElementById("signupNickname");


    if (
        !emailInput ||
        !passwordInput ||
        !nicknameInput
    ) {
        return;
    }


    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    const nickname =
        nicknameInput.value.trim();


    /* ================================
       입력값 검사
    ================================= */

    if (!email) {

        showMessage(
            "이메일을 입력해주세요.",
            true
        );

        return;
    }


    if (password.length < 6) {

        showMessage(
            "비밀번호는 6자 이상 입력해주세요.",
            true
        );

        return;
    }


    if (nickname.length < 2) {

        showMessage(
            "닉네임은 2자 이상 입력해주세요.",
            true
        );

        return;
    }


    if (nickname.length > 20) {

        showMessage(
            "닉네임은 20자 이하로 입력해주세요.",
            true
        );

        return;
    }


    showMessage(
        "회원가입 중..."
    );


    try {

        /* ================================
           서버에 회원가입 요청
        ================================= */

        const response =
            await fetch(
                "/api/auth/signup",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "same-origin",

                    body: JSON.stringify({

                        email: email,

                        password: password,

                        nickname: nickname

                    })
                }
            );


        const result =
            await response.json();


        /* ================================
           서버 오류
        ================================= */

        if (!response.ok) {

            throw new Error(
                result.error ||
                "회원가입에 실패했습니다."
            );

        }


        /* ================================
           회원가입 성공
        ================================= */

        console.log(
            "✅ 회원가입 성공:",
            result.user
        );


        if (
            result.emailConfirmationRequired
        ) {

            showMessage(
                "회원가입 완료! 이메일 인증 후 로그인해주세요."
            );

        }

        else {

            showMessage(
                "회원가입 완료! 로그인되었습니다."
            );

        }


        /* ================================
           로그인 화면으로 전환
        ================================= */

        const signupForm =
            document.getElementById(
                "signupForm"
            );

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        if (signupForm) {

            signupForm.reset();

            signupForm.style.display =
                "none";

        }


        if (loginForm) {

            loginForm.style.display =
                "flex";

        }


        const title =
            document.getElementById(
                "authTitle"
            );

        if (title) {

            title.textContent =
                "책방에 들어오세요";

        }


        const description =
            document.getElementById(
                "authDescription"
            );

        if (description) {

            description.textContent =
                "로그인하고 사람들과 책 이야기를 나눠보세요.";

        }


        const toggle =
            document.getElementById(
                "toggleAuth"
            );

        if (toggle) {

            toggle.textContent =
                "계정이 없으신가요? 회원가입";

        }


        /* 이메일 자동 입력 */

        const loginEmail =
            document.getElementById(
                "loginEmail"
            );

        if (loginEmail) {

            loginEmail.value =
                email;

        }


    }

    catch (error) {

        console.error(
            "❌ 회원가입 오류:",
            error
        );


        showMessage(
            error.message ||
            "회원가입에 실패했습니다.",
            true
        );

    }

}


/* ========================================
   로그인
======================================== */

async function login() {

    const emailInput =
        document.getElementById(
            "loginEmail"
        );

    const passwordInput =
        document.getElementById(
            "loginPassword"
        );


    if (
        !emailInput ||
        !passwordInput
    ) {
        return;
    }


    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    /* ================================
       입력값 검사
    ================================= */

    if (!email) {

        showMessage(
            "이메일을 입력해주세요.",
            true
        );

        return;
    }


    if (!password) {

        showMessage(
            "비밀번호를 입력해주세요.",
            true
        );

        return;
    }


    showMessage(
        "로그인 중..."
    );


    try {

        /* ================================
           서버 로그인 요청
        ================================= */

        const response =
            await fetch(
                "/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "same-origin",

                    body: JSON.stringify({

                        email: email,

                        password: password

                    })
                }
            );


        const result =
            await response.json();


        /* ================================
           로그인 실패
        ================================= */

        if (!response.ok) {

            throw new Error(
                result.error ||
                "로그인에 실패했습니다."
            );

        }


        if (!result.success) {

            throw new Error(
                result.error ||
                "로그인에 실패했습니다."
            );

        }


        /* ================================
           로그인 성공
        ================================= */

        console.log(
            "✅ 로그인 성공:",
            result.user
        );


        showMessage(
            `${result.user.nickname}님, 환영합니다.`
        );


        /* ================================
           홈페이지 이동
        ================================= */

        setTimeout(
            () => {

                window.location.href =
                    "/";

            },
            500
        );

    }

    catch (error) {

        console.error(
            "❌ 로그인 오류:",
            error
        );


        showMessage(
            error.message ||
            "로그인에 실패했습니다.",
            true
        );

    }

}


/* ========================================
   현재 로그인 상태 확인
======================================== */

async function checkSession() {

    try {

        const response =
            await fetch(
                "/api/auth/me",
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

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


        console.log(
            "✅ 현재 로그인 사용자:",
            result.user
        );


        return result.user;

    }

    catch (error) {

        console.error(
            "❌ 로그인 상태 확인 오류:",
            error
        );

        return null;

    }

}


/* ========================================
   이미 로그인한 사용자 처리
======================================== */

async function redirectIfLoggedIn() {

    const user =
        await checkSession();


    if (!user) {
        return;
    }


    /*
       이미 로그인한 상태에서
       login.html에 들어오면
       홈페이지로 이동
    */

    showMessage(
        `${user.nickname}님은 이미 로그인되어 있습니다.`
    );


    setTimeout(
        () => {

            window.location.href =
                "/";

        },
        500
    );

}


/* ========================================
   폼 이벤트
======================================== */

function setupForms() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const signupForm =
        document.getElementById(
            "signupForm"
        );


    /* 로그인 */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                login();

            }
        );

    }


    /* 회원가입 */

    if (signupForm) {

        signupForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                signup();

            }
        );

    }

}


/* ========================================
   시작
======================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupAuthToggle();

        setupForms();

        await redirectIfLoggedIn();

    }
);

