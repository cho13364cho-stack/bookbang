
// ========================================
// 📚 책방 서버
// Node.js + Express + Supabase
// ========================================

require("dotenv").config();

const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT =
    process.env.PORT || 3000;


/* ========================================
   환경변수
======================================== */

const supabaseUrl =
    process.env.SUPABASE_URL;

const supabaseKey =
    process.env.SUPABASE_KEY;


if (!supabaseUrl || !supabaseKey) {

    console.error(
        "❌ SUPABASE_URL / SUPABASE_KEY가 없습니다."
    );

    process.exit(1);
}


/* ========================================
   Supabase
======================================== */

const supabase =
    createClient(
        supabaseUrl,
        supabaseKey
    );


/* ========================================
   Express
======================================== */

app.use(
    express.json({
        limit: "10kb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10kb"
    })
);


/* ========================================
   정적 파일
======================================== */

app.use(
    express.static(__dirname)
);


/* ========================================
   쿠키 가져오기
======================================== */

function getCookie(req, name) {

    const cookieHeader =
        req.headers.cookie;

    if (!cookieHeader) {
        return null;
    }


    const cookies =
        cookieHeader
            .split(";")
            .map(cookie => cookie.trim());


    for (const cookie of cookies) {

        const separator =
            cookie.indexOf("=");

        if (separator === -1) {
            continue;
        }


        const key =
            cookie.substring(
                0,
                separator
            );

        const value =
            cookie.substring(
                separator + 1
            );


        if (key === name) {

            return decodeURIComponent(
                value
            );
        }
    }


    return null;
}


/* ========================================
   인증 쿠키 설정
======================================== */

function setAuthCookies(
    res,
    accessToken,
    refreshToken
) {

    const secure =
        process.env.NODE_ENV === "production"
            ? "; Secure"
            : "";


    res.setHeader(
        "Set-Cookie",
        [
            `bookbang_access_token=${encodeURIComponent(accessToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600${secure}`,

            `bookbang_refresh_token=${encodeURIComponent(refreshToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`
        ]
    );
}


/* ========================================
   인증 쿠키 삭제
======================================== */

function clearAuthCookies(res) {

    res.setHeader(
        "Set-Cookie",
        [
            "bookbang_access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",

            "bookbang_refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
        ]
    );
}


/* ========================================
   현재 사용자 가져오기
======================================== */

async function getCurrentUser(req) {

    const accessToken =
        getCookie(
            req,
            "bookbang_access_token"
        );


    if (!accessToken) {
        return null;
    }


    const {
        data,
        error
    } =
        await supabase.auth.getUser(
            accessToken
        );


    if (error || !data.user) {
        return null;
    }


    return data.user;
}


/* ========================================
   홈페이지
======================================== */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );
});


/* ========================================
   로그인 / 회원가입
======================================== */


/* 회원가입 */

app.post(
    "/api/auth/signup",
    async (req, res) => {

        const email =
            String(
                req.body.email || ""
            ).trim();

        const password =
            String(
                req.body.password || ""
            );

        const nickname =
            String(
                req.body.nickname || ""
            ).trim();


        if (!email) {

            return res.status(400).json({
                success: false,
                error: "이메일을 입력해주세요."
            });
        }


        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                error:
                    "비밀번호는 6자 이상 입력해주세요."
            });
        }


        if (
            nickname.length < 2 ||
            nickname.length > 20
        ) {

            return res.status(400).json({
                success: false,
                error:
                    "닉네임은 2~20자로 입력해주세요."
            });
        }


        try {

            const {
                data,
                error
            } =
                await supabase.auth.signUp({

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
                    "❌ 회원가입 오류:",
                    error.message
                );


                if (
                    error.message
                        .toLowerCase()
                        .includes(
                            "already registered"
                        )
                ) {

                    return res.status(409).json({
                        success: false,
                        error:
                            "이미 가입된 이메일입니다."
                    });
                }


                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }


            if (!data.user) {

                return res.status(400).json({
                    success: false,
                    error:
                        "회원가입에 실패했습니다."
                });
            }


            /*
                이메일 인증이 꺼져 있으면
                session이 바로 생성된다.
            */

            if (data.session) {

                setAuthCookies(
                    res,
                    data.session.access_token,
                    data.session.refresh_token
                );
            }


            return res.status(201).json({

                success: true,

                emailConfirmationRequired:
                    !data.session,

                user: {

                    id: data.user.id,

                    email: data.user.email,

                    nickname:
                        data.user.user_metadata
                            ?.nickname || nickname
                }
            });


        } catch (error) {

            console.error(
                "❌ 회원가입 서버 오류:",
                error
            );


            return res.status(500).json({
                success: false,
                error:
                    "회원가입 중 서버 오류가 발생했습니다."
            });
        }
    }
);


/* 로그인 */

app.post(
    "/api/auth/login",
    async (req, res) => {

        const email =
            String(
                req.body.email || ""
            ).trim();

        const password =
            String(
                req.body.password || ""
            );


        if (!email || !password) {

            return res.status(400).json({
                success: false,
                error:
                    "이메일과 비밀번호를 입력해주세요."
            });
        }


        try {

            const {
                data,
                error
            } =
                await supabase.auth
                    .signInWithPassword({

                        email: email,

                        password: password
                    });


            if (error) {

                console.error(
                    "❌ 로그인 오류:",
                    error.message
                );


                return res.status(401).json({
                    success: false,
                    error:
                        "이메일 또는 비밀번호가 올바르지 않습니다."
                });
            }


            if (
                !data.session ||
                !data.user
            ) {

                return res.status(401).json({
                    success: false,
                    error:
                        "로그인 세션을 만들 수 없습니다."
                });
            }


            setAuthCookies(
                res,
                data.session.access_token,
                data.session.refresh_token
            );


            return res.json({

                success: true,

                user: {

                    id: data.user.id,

                    email: data.user.email,

                    nickname:
                        data.user.user_metadata
                            ?.nickname || "사용자"
                }
            });


        } catch (error) {

            console.error(
                "❌ 로그인 서버 오류:",
                error
            );


            return res.status(500).json({
                success: false,
                error:
                    "로그인 중 서버 오류가 발생했습니다."
            });
        }
    }
);


/* 현재 로그인 사용자 */

app.get(
    "/api/auth/me",
    async (req, res) => {

        try {

            const user =
                await getCurrentUser(req);


            if (!user) {

                return res.status(401).json({
                    success: false,
                    error:
                        "로그인되어 있지 않습니다."
                });
            }


            return res.json({

                success: true,

                user: {

                    id: user.id,

                    email: user.email,

                    nickname:
                        user.user_metadata
                            ?.nickname || "사용자"
                }
            });


        } catch (error) {

            console.error(
                "❌ 사용자 확인 오류:",
                error
            );


            return res.status(500).json({
                success: false,
                error:
                    "로그인 상태를 확인하지 못했습니다."
            });
        }
    }
);


/* 로그아웃 */

app.post(
    "/api/auth/logout",
    (req, res) => {

        clearAuthCookies(res);


        return res.json({
            success: true
        });
    }
);


/* ========================================
   책 목록
======================================== */

app.get(
    "/api/books",
    async (req, res) => {

        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("books")
                    .select("*")
                    .order("title");


            if (error) {

                console.error(
                    "❌ 책 목록 오류:",
                    error.message
                );


                return res.status(500).json({
                    success: false,
                    error:
                        "책 목록을 불러오지 못했습니다."
                });
            }


            return res.json({

                success: true,

                books: data || []
            });


        } catch (error) {

            console.error(
                "❌ 책 목록 서버 오류:",
                error
            );


            return res.status(500).json({
                success: false,
                error:
                    "서버 오류가 발생했습니다."
            });
        }
    }
);


/* ========================================
   DB 연결 테스트
======================================== */

app.get(
    "/test-db",
    async (req, res) => {

        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("books")
                    .select("*");


            if (error) {

                return res.status(500).json({

                    success: false,

                    error:
                        error.message
                });
            }


            return res.json({

                success: true,

                message:
                    "📚 DB 연결 성공!",

                books: data || []
            });


        } catch (error) {

            return res.status(500).json({

                success: false,

                error:
                    error.message
            });
        }
    }
);


/* ========================================
   메시지 불러오기
======================================== */

app.get(
    "/api/messages/:bookId",
    async (req, res) => {

        const bookId =
            String(
                req.params.bookId || ""
            ).trim();


        if (!bookId) {

            return res.status(400).json({

                success: false,

                error:
                    "책 정보가 없습니다."
            });
        }


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("messages")
                    .select("*")
                    .eq("book_id", bookId)
                    .order(
                        "created_at",
                        {
                            ascending: true
                        }
                    );


            if (error) {

                console.error(
                    "❌ 메시지 조회 오류:",
                    error.message
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "메시지를 불러오지 못했습니다."
                });
            }


            return res.json({

                success: true,

                messages:
                    data || []
            });


        } catch (error) {

            console.error(
                "❌ 메시지 서버 오류:",
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    "서버 오류가 발생했습니다."
            });
        }
    }
);


/* ========================================
   메시지 저장
======================================== */

app.post(
    "/api/messages",
    async (req, res) => {

        const bookId =
            String(
                req.body.book_id || ""
            ).trim();

        const nickname =
            String(
                req.body.nickname || ""
            ).trim();

        const content =
            String(
                req.body.content || ""
            ).trim();


        if (
            !bookId ||
            !nickname ||
            !content
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "필수 정보가 없습니다."
            });
        }


        if (content.length > 500) {

            return res.status(400).json({

                success: false,

                error:
                    "메시지는 500자 이하로 작성해주세요."
            });
        }


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from("messages")
                    .insert([

                        {

                            book_id:
                                bookId,

                            nickname:
                                nickname,

                            content:
                                content
                        }

                    ])
                    .select()
                    .single();


            if (error) {

                console.error(
                    "❌ 메시지 저장 오류:",
                    error.message
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "메시지를 저장하지 못했습니다."
                });
            }


            return res.status(201).json({

                success: true,

                message:
                    data
            });


        } catch (error) {

            console.error(
                "❌ 메시지 서버 오류:",
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    "서버 오류가 발생했습니다."
            });
        }
    }
);


/* ========================================
   잘못된 API
======================================== */

app.use(
    "/api",
    (req, res) => {

        return res.status(404).json({

            success: false,

            error:
                "API를 찾을 수 없습니다."
        });
    }
);


/* ========================================
   존재하지 않는 페이지
======================================== */

app.use(
    (req, res) => {

        return res.status(404).send(
            "페이지를 찾을 수 없습니다."
        );
    }
);


/* ========================================
   서버 오류
======================================== */

app.use(
    (error, req, res, next) => {

        console.error(
            "❌ 서버 오류:",
            error
        );


        return res.status(500).json({

            success: false,

            error:
                "서버에서 오류가 발생했습니다."
        });
    }
);


/* ========================================
   서버 실행
======================================== */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "================================"
        );

        console.log(
            "📚 책방 서버 실행"
        );

        console.log(
            "================================"
        );

        console.log(
            `🌐 Port: ${PORT}`
        );

        console.log(
            "================================"
        );

        console.log("");
    }
);

