```javascript
/* ========================================
   📚 책방 로그인 / 회원가입
======================================== */

console.log("🔥 AUTH.JS 실행됨");

let supabaseClient = null;


/* ========================================
   Supabase 연결
======================================== */

async function initSupabase() {

    try {

        const response =
            await fetch("/api/realtime-config", {
                cache: "no-store"
            });

        if (!response.ok) {
            throw new Error(
                "Supabase 설정을 가져오지 못했습니다."
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
                "Supabase 연결 설정이 없습니다."
            );
        }

        supabaseClient =
            window.supabase.createClient(
                config.url,
                config.key
            );

        console.log("✅ Supabase 연결 성공");

        return true;

    } catch (error) {

        console.error(
            "❌ Supabase 연결 오류:",
            error
        );

        showMessage(
            "서버 연결에 실패했습니다.",
            true
        );

        return false;
    }
}


/* ========================================
   메시지
======================================== */

function showMessage(
    message,
    isError = false
) {

    const element =
        document.getElementById(
            "authMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.style.color =
        isError
            ? "#c0392b"
            : "#777772";
}


/* ========================================
   로그인 / 회원가입 전환
======================================== */

function setupAuthToggle() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const signupForm =
        document.getElementById(
            "signupForm"
        );

    const title =
        document.getElementById(
            "authTitle"
        );

    const description =
        document.getElementById(
            "authDescription"
        );

    const toggle =
        document.getElementById(
            "toggleAuth"
        );


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

            } else {

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
        document.getElementById(
            "signupEmail"
        );

    const passwordInput =
        document.getElementById(
            "signupPassword"
        );

    const nicknameInput =
        document.getElementById(
            "signupNickname"
        );


    if (
        !emailInput ||
        !passwordInput ||
        !nicknameInput
    ) {
        console.error(
            "❌ 회원가입 입력창을 찾을 수 없습니다."
        );

        return;
    }


    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    const nickname =
        nicknameInput.value.trim();


    /* 입력값 확인 */

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


    if (password.length < 6) {

        showMessage(
            "비밀번호는 6자 이상 입력해주세요.",
            true
        );

        return;
    }


    if (!nickname) {

        showMessage(
            "닉네임을 입력해주세요.",
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

        /*
            ⭐ 핵심

            profiles 테이블에 직접 INSERT하지 않는다.

            닉네임을 Auth metadata에 저장한다.
            DB 트리거가 자동으로 profiles에 저장한다.
        */

        const {
            data,
            error
        } =
            await supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {
                        nickname: nickname
                    }

                }

            });


        if (error) {

            console.error(
                "❌ Supabase 회원가입 오류:",
                error
            );

            throw error;
        }


        if (!data.user) {

            throw new Error(
                "회원가입에 실패했습니다."
            );

        }


        console.log(
            "✅ Auth 계정 생성:",
            data.user.id
        );


        /*
            이메일 인증 여부 확인
        */

        if (!data.session) {

            showMessage(
                "회원가입 완료! 이메일 인증 후 로그인해주세요."
            );

        } else {

            showMessage(
                "회원가입 완료! 로그인되었습니다."
            );

        }


        /*
            회원가입 폼 초기화
        */

        const signupForm =
            document.getElementById(
                "signupForm"
            );

        if (signupForm) {
            signupForm.reset();
        }


        /*
            로그인 화면으로 전환
        */

        const loginForm =
            document.getElementById(
                "loginForm"
            );

        if (loginForm) {
            loginForm.style.display =
                "flex";
        }

        if (signupForm) {
            signupForm.style.display =
                "none";
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


        /*
            로그인 이메일 자동 입력
        */

        const loginEmail =
            document.getElementById(
                "loginEmail"
            );

        if (loginEmail) {
            loginEmail.value =
                email;
        }


    } catch (error) {

        console.error(
            "❌ 회원가입 오류:",
            error
        );


        if (
            error.message &&
            error.message.includes(
                "already registered"
            )
        ) {

            showMessage(
                "이미 가입된 이메일입니다. 로그인해주세요.",
                true
            );

            return;
        }


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


    if (!email || !password) {

        showMessage(
            "이메일과 비밀번호를 입력해주세요.",
            true
        );

        return;
    }


    showMessage(
        "로그인 중..."
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({

                    email: email,

                    password: password

                });


        if (error) {

            throw error;
        }


        if (!data.user) {

            throw new Error(
                "로그인에 실패했습니다."
            );

        }


        console.log(
            "✅ 로그인 성공:",
            data.user.id
        );


        showMessage(
            "로그인되었습니다."
        );


        setTimeout(
            () => {

                window.location.href =
                    "/";

            },
            500
        );


    } catch (error) {

        console.error(
            "❌ 로그인 오류:",
            error
        );


        showMessage(
            "이메일 또는 비밀번호가 올바르지 않습니다.",
            true
        );
    }
}


/* ========================================
   로그인 상태 확인
======================================== */

async function checkSession() {

    if (!supabaseClient) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient.auth
            .getSession();


    if (error) {

        console.error(
            "❌ 세션 확인 오류:",
            error
        );

        return;
    }


    if (data.session) {

        console.log(
            "✅ 이미 로그인되어 있습니다."
        );

    }
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


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                login();

            }
        );

    }


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

        const connected =
            await initSupabase();


        if (!connected) {
            return;
        }


        setupAuthToggle();

        setupForms();

        await checkSession();

    }
);
```

