
// ========================================
// 📚 책방 서버
// Node.js + Express + Supabase
// 익명 사용자 시스템
// ========================================

require("dotenv").config();

const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 3000;


// ========================================
// Supabase 설정
// ========================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {

    console.error(
        "❌ Supabase 환경변수가 없습니다."
    );

    process.exit(1);
}

const supabase = createClient(
    supabaseUrl,
    supabaseKey
);


// ========================================
// Express 설정
// ========================================

app.use(express.json({
    limit: "10kb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "10kb"
}));


// ========================================
// 쿠키 읽기
// ========================================

function getCookie(req, name) {

    const cookieHeader =
        req.headers.cookie;

    if (!cookieHeader) {
        return null;
    }

    const cookies =
        cookieHeader.split(";");

    for (const cookie of cookies) {

        const parts =
            cookie.trim().split("=");

        const key =
            parts.shift();

        const value =
            parts.join("=");

        if (key === name) {

            try {

                return decodeURIComponent(
                    value
                );

            } catch {

                return value;

            }
        }
    }

    return null;
}


// ========================================
// 인증 쿠키 설정
// ========================================

function setAuthCookies(
    res,
    session
) {

    const secure =
        process.env.NODE_ENV === "production"
            ? "; Secure"
            : "";

    res.setHeader(
        "Set-Cookie",
        [

            "bookbang_access_token=" +
                encodeURIComponent(
                    session.access_token
                ) +
                "; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600" +
                secure,

            "bookbang_refresh_token=" +
                encodeURIComponent(
                    session.refresh_token
                ) +
                "; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000" +
                secure

        ]
    );
}


// ========================================
// 인증 쿠키 삭제
// ========================================

function clearAuthCookies(res) {

    res.setHeader(
        "Set-Cookie",
        [

            "bookbang_access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",

            "bookbang_refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"

        ]
    );
}


// ========================================
// 현재 로그인 사용자 확인
// ========================================

async function getCurrentUser(req) {

    const accessToken =
        getCookie(
            req,
            "bookbang_access_token"
        );

    if (!accessToken) {
        return null;
    }

    try {

        const {
            data,
            error
        } =
            await supabase.auth.getUser(
                accessToken
            );

        if (
            error ||
            !data ||
            !data.user
        ) {

            return null;

        }

        return data.user;

    } catch (error) {

        console.error(
            "❌ 사용자 확인 오류:",
            error.message
        );

        return null;
    }
}


// ========================================
// 정적 파일
// ========================================

app.use(
    express.static(
        __dirname,
        {
            index: false
        }
    )
);


// ========================================
// ⭐ 홈페이지
// ========================================

app.get(
    "/",
    async (req, res) => {

        const user =
            await getCurrentUser(req);


        // 로그인하지 않은 경우
        // 로그인 페이지로 이동

        if (!user) {

            return res.sendFile(
                path.join(
                    __dirname,
                    "login.html"
                )
            );
        }


        // 로그인한 경우
        // 책방 메인 페이지

        return res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


// ========================================
// 회원가입
// ========================================
// 닉네임 없음
// 이메일 + 비밀번호만 사용
// ========================================

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


        // 이메일 검사

        if (!email) {

            return res.status(400).json({

                success: false,

                error:
                    "이메일을 입력해주세요."

            });

        }


        // 비밀번호 검사

        if (password.length < 6) {

            return res.status(400).json({

                success: false,

                error:
                    "비밀번호는 6자 이상 입력해주세요."

            });

        }


        try {

            const {
                data,
                error
            } =
                await supabase.auth.signUp({

                    email: email,

                    password: password

                });


            // Supabase 오류

            if (error) {

                console.error(
                    "❌ 회원가입 오류:",
                    error.message
                );

                return res.status(400).json({

                    success: false,

                    error:
                        error.message

                });

            }


            // 사용자 생성 실패

            if (
                !data ||
                !data.user
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "회원가입에 실패했습니다."

                });

            }


            // 이메일 인증이 꺼져 있으면
            // 바로 로그인

            if (data.session) {

                setAuthCookies(
                    res,
                    data.session
                );

            }


            return res.status(201).json({

                success: true,

                emailConfirmationRequired:
                    !data.session,

                user: {

                    id:
                        data.user.id,

                    email:
                        data.user.email

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


// ========================================
// 로그인
// ========================================

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


        if (
            !email ||
            !password
        ) {

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
                await supabase.auth.signInWithPassword({

                    email:
                        email,

                    password:
                        password

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


            // 인증 쿠키 저장

            setAuthCookies(
                res,
                data.session
            );


            return res.json({

                success: true,

                user: {

                    id:
                        data.user.id,

                    email:
                        data.user.email

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


// ========================================
// 현재 로그인 사용자
// ========================================
// 개인정보는 최소한으로 반환
// ========================================

app.get(
    "/api/auth/me",
    async (req, res) => {

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

                id:
                    user.id,

                email:
                    user.email

            }

        });

    }
);


// ========================================
// 로그아웃
// ========================================

app.post(
    "/api/auth/logout",
    (req, res) => {

        clearAuthCookies(res);

        return res.json({

            success: true

        });

    }
);


// ========================================
// 책 목록
// ========================================

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

                books:
                    data || []

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


// ========================================
// 메시지 목록
// ========================================

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
                    .eq(
                        "book_id",
                        bookId
                    )
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


            // 기존 nickname 컬럼이 DB에 있어도
            // 화면에는 익명으로만 표시

            const anonymousMessages =
                (data || []).map(
                    message => ({

                        id:
                            message.id,

                        book_id:
                            message.book_id,

                        content:
                            message.content,

                        created_at:
                            message.created_at,

                        nickname:
                            "익명"

                    })
                );


            return res.json({

                success: true,

                messages:
                    anonymousMessages

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


// ========================================
// 메시지 저장
// ========================================

app.post(
    "/api/messages",
    async (req, res) => {

        const bookId =
            String(
                req.body.book_id || ""
            ).trim();

        const content =
            String(
                req.body.content || ""
            ).trim();


        // 책 ID 검사

        if (!bookId) {

            return res.status(400).json({

                success: false,

                error:
                    "책 정보가 없습니다."

            });

        }


        // 메시지 검사

        if (!content) {

            return res.status(400).json({

                success: false,

                error:
                    "메시지를 입력해주세요."

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

            // 로그인 사용자 확인

            const user =
                await getCurrentUser(req);


            if (!user) {

                return res.status(401).json({

                    success: false,

                    error:
                        "로그인이 필요합니다."

                });

            }


            // ====================================
            // 메시지 저장
            // ====================================
            // user_id가 있으면 user_id 사용
            // 없다면 기존 DB 구조를 고려하여
            // nickname = 익명으로 저장
            // ====================================

            const insertData = {

                book_id:
                    bookId,

                content:
                    content

            };


            // 현재 messages 테이블에
            // user_id 컬럼이 있다면 사용

            insertData.user_id =
                user.id;


            const {
                data,
                error
            } =
                await supabase
                    .from("messages")
                    .insert([
                        insertData
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

                message: {

                    id:
                        data.id,

                    book_id:
                        data.book_id,

                    content:
                        data.content,

                    created_at:
                        data.created_at,

                    nickname:
                        "익명"

                }

            });

        } catch (error) {

            console.error(
                "❌ 메시지 서버 오류:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "메시지 저장 중 서버 오류가 발생했습니다."

            });

        }

    }
);


// ========================================
// 존재하지 않는 API
// ========================================

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


// ========================================
// 존재하지 않는 페이지
// ========================================

app.use(
    (req, res) => {

        return res.status(404).send(
            "페이지를 찾을 수 없습니다."
        );

    }
);


// ========================================
// 서버 오류 처리
// ========================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

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


// ========================================
// 서버 시작
// ========================================

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
            "🌐 Port:",
            PORT
        );

        console.log(
            "👤 익명 사용자 시스템"
        );

        console.log(
            "================================"
        );

        console.log("");

    }
);

