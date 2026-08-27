```javascript
/* ========================================
   📚 책방 인증 시스템
======================================== */

let supabaseClient = null;


/* ========================================
   Supabase 연결
======================================== */

async function initSupabase() {

    try {

        const response =
            await fetch("/api/realtime-config");

        if (!response.ok) {
            throw new Error(
                "Supabase 설정을 가져오지 못했습니다."
            );
        }

        const config =
            await response.json();

        if (!config.url || !config.key) {
            throw new Error(
                "Supabase 설정이 없습니다."
            );
        }

        supabaseClient =
            window.supabase.createClient(
                config.url,
                config.key
            );

        return true;

    } catch (error) {

        console.error(
            "❌ Supabase 연결 오류:",
            error
        );

        showMessage(
            "서버에 연결할 수 없습니다.",
            true
        );

        return false;
    }
}


/* ========================================
   메시지 표시
======================================== */

function showMessage(message, isError = false) {

    const element =
        document.getElementById("authMessage");

    if (!element) {
        return;
    }

    element.textContent = message;

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
        !title ||
        !description ||
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

                title.textContent =
                    "책방에 들어오세요";

                description.textContent =
                    "로그인하고 사람들과 책 이야기를 나눠보세요.";

                toggle.textContent =
                    "계정이 없으신가요? 회원가입";

            } else {

                loginForm.style.display =
                    "none";

                signupForm.style.display =
                    "flex";

                title.textContent =
                    "책방 계정 만들기";

                description.textContent =
                    "닉네임을 정하고 책방에 참여해보세요.";

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

    const email =
        document
            .getElementById("signupEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("signupPassword")
            .value;

    const nickname =
        document
            .getElementById("signupNickname")
            .value
            .trim();


    if (!email || !password || !nickname) {

        showMessage(
            "모든 항목을 입력해주세요.",
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
            Supabase Auth 계정 생성
        */

        const {
            data,
            error
        } =
            await supabaseClient.auth.signUp({
                email,
                password
            });


        if (error) {
            throw error;
        }


        if (!data.user) {

            throw new Error(
                "회원가입에 실패했습니다."
            );

        }


        /*
            profiles 테이블에
            닉네임 저장
        */

        const {
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .insert({
                    id: data.user.id,
                    nickname: nickname
                });


        if (profileError) {

            /*
                닉네임 중복 등의 오류
            */

            console.error(
                "❌ 프로필 저장 오류:",
                profileError
            );

            throw new Error(
                "닉네임을 저장하지 못했습니다. 이미 사용 중인 닉네임인지 확인해주세요."
            );
        }


        showMessage(
            "회원가입이 완료되었습니다. 로그인해주세요."
        );


        document
            .getElementById("signupForm")
            .reset();


        document
            .getElementById("loginEmail")
            .value = email;


        document
            .getElementById("loginForm")
            .style.display = "flex";


        document
            .getElementById("signupForm")
            .style.display = "none";


        document
            .getElementById("authTitle")
            .textContent =
                "책방에 들어오세요";


        document
            .getElementById("authDescription")
            .textContent =
                "로그인하고 사람들과 책 이야기를 나눠보세요.";


        document
            .getElementById("toggleAuth")
            .textContent =
                "계정이 없으신가요? 회원가입";


    } catch (error) {

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

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;


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
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });


        if (error) {
            throw error;
        }


        if (!data.user) {

            throw new Error(
                "로그인에 실패했습니다."
            );

        }


        showMessage(
            "로그인되었습니다."
        );


        /*
            홈 화면으로 이동
        */

        setTimeout(
            () => {

                window.location.href =
                    "/";

            },
            400
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
   이미 로그인되어 있는지 확인
======================================== */

async function checkSession() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "❌ 세션 확인 오류:",
            error
        );

        return;
    }


    if (data.session) {

        window.location.href =
            "/";

    }
}


/* ========================================
   이벤트
======================================== */

function setupForms() {

    const loginForm =
        document.getElementById("loginForm");

    const signupForm =
        document.getElementById("signupForm");


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

        await checkSession();

        setupAuthToggle();

        setupForms();

    }
);
```
