
// ========================================
// 📚 책방 서버
// Anonymous Book Community
//
// Node.js + Express + Supabase
//
// 현재 기능
// 1. 익명 사용자
// 2. 익명 닉네임
// 3. 책 목록
// 4. 책별 토론방
// 5. 익명 메시지 작성
// 6. 익명 메시지 조회
//
// 추후 확장
// 7. 프로필
// 8. 친구 추가
// 9. 1:1 대화
// 10. 읽은 책
// 11. 별점
// 12. 리뷰
// ========================================


require("dotenv").config();

const express = require("express");
const path = require("path");
const crypto = require("crypto");

const { createClient } =
    require("@supabase/supabase-js");


const app = express();

const PORT =
    process.env.PORT || 3000;


// ========================================
// Supabase
// ========================================

const supabaseUrl =
    process.env.SUPABASE_URL;

const supabaseKey =
    process.env.SUPABASE_KEY;


if (!supabaseUrl || !supabaseKey) {

    console.error("");
    console.error("❌ Supabase 환경변수가 없습니다.");
    console.error("");
    console.error("SUPABASE_URL");
    console.error("SUPABASE_KEY");
    console.error("");

    process.exit(1);
}


const supabase =
    createClient(
        supabaseUrl,
        supabaseKey
    );


// ========================================
// Express
// ========================================

app.use(
    express.json({
        limit: "20kb"
    })
);


app.use(
    express.urlencoded({
        extended: true,
        limit: "20kb"
    })
);


// ========================================
// 익명 사용자 ID
// ========================================
//
// 로그인 대신 브라우저별 익명 ID를 사용합니다.
//
// 쿠키가 없으면 서버가 새 ID를 만들어 줍니다.
//
// 예:
// anonymous_id = 7f3c...
//
// 이 ID를 이용하면 나중에
// 프로필 / 리뷰 / 별점 / 친구 기능 등을
// 연결할 수 있습니다.
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
// 익명 사용자 생성
// ========================================

function createAnonymousId() {

    return crypto
        .randomUUID();

}


// ========================================
// 익명 사용자 가져오기
// ========================================

function getAnonymousId(req) {

    const existingId =
        getCookie(
            req,
            "bookbang_anonymous_id"
        );


    if (existingId) {

        return existingId;

    }


    return createAnonymousId();

}


// ========================================
// 익명 사용자 쿠키 설정
// ========================================

function setAnonymousCookie(
    res,
    anonymousId
) {

    const secure =
        process.env.NODE_ENV === "production"
            ? "; Secure"
            : "";


    res.setHeader(
        "Set-Cookie",
        [
            "bookbang_anonymous_id=" +
                encodeURIComponent(
                    anonymousId
                ) +
                "; Path=/" +
                "; HttpOnly" +
                "; SameSite=Lax" +
                "; Max-Age=31536000" +
                secure
        ]
    );

}


// ========================================
// 익명 닉네임
// ========================================
//
// 익명 ID와 별개로
// 사용자가 화면에서 볼 이름입니다.
//
// 예:
// 익명_4821
// 익명_1038
//
// 나중에 프로필에서 변경 가능하도록
// 구조를 분리해 둡니다.
// ========================================

function createAnonymousNickname() {

    const number =
        Math.floor(
            1000 +
            Math.random() * 9000
        );


    return `익명_${number}`;

}


// ========================================
// 현재 익명 사용자
// ========================================
//
// 지금은 로그인하지 않습니다.
//
// 브라우저 최초 방문 시
// 익명 ID + 익명 닉네임을 생성합니다.
// ========================================

function getAnonymousUser(req, res) {

    let anonymousId =
        getCookie(
            req,
            "bookbang_anonymous_id"
        );


    let nickname =
        getCookie(
            req,
            "bookbang_anonymous_nickname"
        );


    if (!anonymousId) {

        anonymousId =
            createAnonymousId();


        setAnonymousCookie(
            res,
            anonymousId
        );

    }


    if (!nickname) {

        nickname =
            createAnonymousNickname();


        const secure =
            process.env.NODE_ENV === "production"
                ? "; Secure"
                : "";


        const existingCookie =
            `bookbang_anonymous_id=${encodeURIComponent(
                anonymousId
            )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`;


        const nicknameCookie =
            `bookbang_anonymous_nickname=${encodeURIComponent(
                nickname
            )}; Path=/; SameSite=Lax; Max-Age=31536000${secure}`;


        res.setHeader(
            "Set-Cookie",
            [
                existingCookie,
                nicknameCookie
            ]
        );

    }


    return {

        id: anonymousId,

        nickname: nickname

    };

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
// 홈페이지
// ========================================

app.get(
    "/",
    (req, res) => {

        return res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);


// ========================================
// 익명 사용자 정보
// ========================================
//
// 프론트에서 현재 익명 닉네임을
// 가져갈 수 있습니다.
//
// GET /api/user
// ========================================

app.get(
    "/api/user",
    (req, res) => {

        try {

            const user =
                getAnonymousUser(
                    req,
                    res
                );


            return res.json({

                success: true,

                user: {

                    id: user.id,

                    nickname:
                        user.nickname

                }

            });

        } catch (error) {

            console.error(
                "❌ 익명 사용자 오류:",
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    "사용자 정보를 불러오지 못했습니다."

            });

        }

    }
);


// ========================================
// 익명 닉네임 변경
// ========================================
//
// POST /api/user/nickname
//
// body:
// {
//     "nickname": "책읽는사람"
// }
// ========================================

app.post(
    "/api/user/nickname",
    (req, res) => {

        const nickname =
            String(
                req.body.nickname || ""
            ).trim();


        if (!nickname) {

            return res.status(400).json({

                success: false,

                error:
                    "닉네임을 입력해주세요."

            });

        }


        if (nickname.length < 2) {

            return res.status(400).json({

                success: false,

                error:
                    "닉네임은 2자 이상 입력해주세요."

            });

        }


        if (nickname.length > 20) {

            return res.status(400).json({

                success: false,

                error:
                    "닉네임은 20자 이하로 입력해주세요."

            });

        }


        const secure =
            process.env.NODE_ENV === "production"
                ? "; Secure"
                : "";


        res.setHeader(
            "Set-Cookie",
            [
                "bookbang_anonymous_nickname=" +
                    encodeURIComponent(
                        nickname
                    ) +
                    "; Path=/" +
                    "; SameSite=Lax" +
                    "; Max-Age=31536000" +
                    secure
            ]
        );


        return res.json({

            success: true,

            nickname: nickname

        });

    }
);


// ========================================
// 익명 사용자 초기화
// ========================================
//
// 필요할 때 새로운 익명 사용자로
// 시작할 수 있도록 준비.
// ========================================

app.post(
    "/api/user/reset",
    (req, res) => {

        const newId =
            createAnonymousId();


        const newNickname =
            createAnonymousNickname();


        const secure =
            process.env.NODE_ENV === "production"
                ? "; Secure"
                : "";


        res.setHeader(
            "Set-Cookie",
            [

                "bookbang_anonymous_id=" +
                    encodeURIComponent(
                        newId
                    ) +
                    "; Path=/" +
                    "; HttpOnly" +
                    "; SameSite=Lax" +
                    "; Max-Age=31536000" +
                    secure,

                "bookbang_anonymous_nickname=" +
                    encodeURIComponent(
                        newNickname
                    ) +
                    "; Path=/" +
                    "; SameSite=Lax" +
                    "; Max-Age=31536000" +
                    secure

            ]
        );


        return res.json({

            success: true,

            user: {

                id: newId,

                nickname:
                    newNickname

            }

        });

    }
);


// ========================================
// 책 목록
// ========================================
//
// GET /api/books
//
// DB:
// books
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
                    .order(
                        "title",
                        {
                            ascending: true
                        }
                    );


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
// 특정 책
// ========================================
//
// GET /api/books/:bookId
// ========================================

app.get(
    "/api/books/:bookId",
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
                    .from("books")
                    .select("*")
                    .eq(
                        "id",
                        bookId
                    )
                    .maybeSingle();


            if (error) {

                console.error(
                    "❌ 책 조회 오류:",
                    error.message
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "책 정보를 불러오지 못했습니다."

                });

            }


            if (!data) {

                return res.status(404).json({

                    success: false,

                    error:
                        "책을 찾을 수 없습니다."

                });

            }


            return res.json({

                success: true,

                book: data

            });

        } catch (error) {

            console.error(
                "❌ 책 조회 서버 오류:",
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
// 책별 메시지 조회
// ========================================
//
// GET /api/messages/:bookId
//
// 로그인 필요 없음.
// 완전 익명.
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
                    .select(
                        "id, book_id, nickname, content, created_at"
                    )
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


// ========================================
// 메시지 작성
// ========================================
//
// POST /api/messages
//
// body:
//
// {
//     "book_id": "...",
//     "content": "정말 좋은 책이네요."
// }
//
// 익명 사용자는 로그인하지 않아도
// 글을 작성할 수 있습니다.
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


        if (!bookId) {

            return res.status(400).json({

                success: false,

                error:
                    "책 정보가 없습니다."

            });

        }


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

            /*
             * 익명 사용자 확인
             */

            const user =
                getAnonymousUser(
                    req,
                    res
                );


            /*
             * 책이 실제로 존재하는지 확인
             */

            const {
                data: book,
                error: bookError
            } =
                await supabase
                    .from("books")
                    .select("id")
                    .eq(
                        "id",
                        bookId
                    )
                    .maybeSingle();


            if (bookError) {

                console.error(
                    "❌ 책 확인 오류:",
                    bookError.message
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "책 정보를 확인하지 못했습니다."

                });

            }


            if (!book) {

                return res.status(404).json({

                    success: false,

                    error:
                        "존재하지 않는 책입니다."

                });

            }


            /*
             * 메시지 저장
             */

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
                                user.nickname,

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

                message: data

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
// 책별 메시지 개수
// ========================================
//
// GET /api/books/:bookId/message-count
//
// 나중에 책 카드에
//
// "이 책의 이야기 128개"
//
// 같은 정보를 표시할 때 사용.
// ========================================

app.get(
    "/api/books/:bookId/message-count",
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
                count,
                error
            } =
                await supabase
                    .from("messages")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    )
                    .eq(
                        "book_id",
                        bookId
                    );


            if (error) {

                console.error(
                    "❌ 메시지 개수 오류:",
                    error.message
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "메시지 개수를 불러오지 못했습니다."

                });

            }


            return res.json({

                success: true,

                count:
                    count || 0

            });

        } catch (error) {

            console.error(
                "❌ 메시지 개수 서버 오류:",
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
// 앞으로 사용할 API 구조
// ========================================
//
// 프로필
//
// GET    /api/profile
// PATCH  /api/profile
//
// 친구
//
// GET    /api/friends
// POST   /api/friends
// DELETE /api/friends/:id
//
// 1:1 대화
//
// GET    /api/chats
// GET    /api/chats/:id/messages
// POST   /api/chats/:id/messages
//
// 별점
//
// GET    /api/books/:bookId/rating
// POST   /api/books/:bookId/rating
//
// 리뷰
//
// GET    /api/books/:bookId/reviews
// POST   /api/books/:bookId/reviews
// DELETE /api/reviews/:id
//
// 읽은 책
//
// GET    /api/profile/books
// POST   /api/profile/books
// DELETE /api/profile/books/:bookId
//
// 지금은 실제 API를 만들지 않고
// 구조만 미리 잡아둡니다.
// ========================================


// ========================================
// 존재하지 않는 API
// ========================================

app.use(
    "/api",
    (req, res) => {

        return res.status(404).json({

            success: false,

            error:
                "요청한 API를 찾을 수 없습니다."

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
// 서버 오류
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
            `🌐 http://localhost:${PORT}`
        );

        console.log(
            "👤 익명 커뮤니티 모드"
        );

        console.log(
            "================================"
        );

        console.log("");

    }
);

