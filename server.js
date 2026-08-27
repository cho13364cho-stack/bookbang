// ========================================
// 📚 책방 서버
// Node.js + Express + Supabase
// ========================================

require("dotenv").config();

const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;


// ========================================
// 기본 설정
// ========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTML / CSS / JS / images 제공
app.use(express.static(__dirname));


// ========================================
// Supabase 연결
// ========================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ .env 파일을 확인해주세요.");
    process.exit(1);
}

const supabase = createClient(
    supabaseUrl,
    supabaseKey
);


// ========================================
// 홈페이지
// ========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


// ========================================
// DB 연결 테스트
// ========================================

// ========================================
// Supabase Realtime 설정
// ========================================

app.get("/api/realtime-config", (req, res) => {

    res.json({
        url: supabaseUrl,
        key: supabaseKey
    });

});

app.get("/test-db", async (req, res) => {

    try {

        const { data, error } =
            await supabase
                .from("books")
                .select("*");

        if (error) {

            console.error(
                "❌ DB 오류:",
                error.message
            );

            return res.status(500).json({
                success: false,
                error: error.message
            });

        }

        res.json({
            success: true,
            message: "📚 DB 연결 성공!",
            books: data
        });

    } catch (error) {

        console.error(
            "❌ 서버 오류:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});


// ========================================
// 책 목록
// ========================================

app.get("/api/books", async (req, res) => {

    try {

        const { data, error } =
            await supabase
                .from("books")
                .select("*")
                .order("title");

        if (error) {

            return res.status(500).json({
                success: false,
                error: error.message
            });

        }

        res.json({
            success: true,
            books: data
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});


// ========================================
// 채팅 메시지 불러오기
// ========================================

app.get("/api/messages/:bookId", async (req, res) => {

    const bookId =
        String(req.params.bookId || "").trim();


    if (!bookId) {

        return res.status(400).json({
            success: false,
            error: "책 정보가 없습니다."
        });

    }


    try {

        const { data, error } =
            await supabase
                .from("messages")
                .select("*")
                .eq("book_id", bookId)
                .order("created_at", {
                    ascending: true
                });


        if (error) {

            console.error(
                "❌ 메시지 조회 오류:",
                error.message
            );

            return res.status(500).json({
                success: false,
                error: error.message
            });

        }


        res.json({
            success: true,
            messages: data || []
        });

    } catch (error) {

        console.error(
            "❌ 서버 오류:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});


// ========================================
// 채팅 메시지 저장
// ========================================

app.post("/api/messages", async (req, res) => {

    const bookId =
        String(req.body.book_id || "").trim();

    const nickname =
        String(req.body.nickname || "").trim();

    const content =
        String(req.body.content || "").trim();


    // 필수값 확인

    if (!bookId || !nickname || !content) {

        return res.status(400).json({
            success: false,
            error: "필수 정보가 없습니다."
        });

    }


    // 메시지 길이 제한

    if (content.length > 500) {

        return res.status(400).json({
            success: false,
            error: "메시지는 500자 이하로 작성해주세요."
        });

    }


    try {

        const { data, error } =
            await supabase
                .from("messages")
                .insert([
                    {
                        book_id: bookId,
                        nickname: nickname,
                        content: content
                    }
                ])
                .select()
                .single();


        if (error) {

            console.error(
                "❌ 메시지 저장 오류:",
                error
            );

            return res.status(500).json({
                success: false,
                error: error.message
            });

        }


        res.status(201).json({
            success: true,
            message: data
        });


    } catch (error) {

        console.error(
            "❌ 서버 오류:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});


// ========================================
// 잘못된 API
// ========================================

app.use("/api", (req, res) => {

    res.status(404).json({
        success: false,
        error: "API를 찾을 수 없습니다."
    });

});


// ========================================
// 서버 실행
// ========================================

app.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("================================");
    console.log("📚 책방 서버 실행");
    console.log("================================");
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📱 http://192.168.0.19:${PORT}`);
    console.log(`🧪 DB 테스트: http://localhost:${PORT}/test-db`);
    console.log("================================");
    console.log("");

});