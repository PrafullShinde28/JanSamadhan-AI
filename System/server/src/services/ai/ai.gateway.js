const api = require("../../config/axios");
const FormData = require("form-data");
const { Client, handle_file } = require("@gradio/client");
const fs = require("fs");
const path = require("path");
const os = require("os");

let gradioClient = null;

async function getGradioClient() {
    if (!gradioClient) {
        const hfUrl = (process.env.AI_SERVER_URL && process.env.AI_SERVER_URL.includes("hf.space"))
            ? process.env.AI_SERVER_URL.split("/api/v1")[0]
            : "https://prafulll-janasamadhan-ai-service.hf.space";
        console.log("🔗 Connecting to Hugging Face ZeroGPU AI Space:", hfUrl);
        gradioClient = await Client.connect(hfUrl);
    }
    return gradioClient;
}

class AIGateway {

    /* ============================================================
       YOLO DETECTION
    ============================================================ */

    static async detectIssue(
        imageBuffer,
        filename = "image.jpg",
        mimetype = "image/jpeg"
    ) {

        if (!imageBuffer) {
            throw new Error(
                "Image buffer is required for YOLO detection"
            );
        }

        const isHf = process.env.AI_SERVER_URL && process.env.AI_SERVER_URL.includes("hf.space");

        if (isHf) {
            console.log("🤖 Sending image to Hugging Face AI Space...");
            const tempFile = path.join(os.tmpdir(), `yolo_${Date.now()}_${filename}`);
            try {
                fs.writeFileSync(tempFile, imageBuffer);
                const fileObj = handle_file(tempFile);
                const client = await getGradioClient();

                // Call Gradio with positional array input [fileObj] and 20s timeout
                const predictPromise = client.predict("/detect", [fileObj]);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("AI inference timed out after 20s")), 20000)
                );

                const result = await Promise.race([predictPromise, timeoutPromise]);
                console.log("✅ Hugging Face AI response received:", result?.data?.[0]?.primary_detection?.class_name || "No objects detected");
                return result.data[0];
            } catch (hfError) {
                console.warn("⚠️ Hugging Face AI inference warning:", hfError.message);
                // Return safe fallback response so complaint routing and worker dispatch proceed seamlessly
                return {
                    success: false,
                    detections: [],
                    primary_detection: null,
                    image_width: 640,
                    image_height: 640,
                    processing_time_ms: 0,
                    fallback: true,
                    error: hfError.message
                };
            } finally {
                if (fs.existsSync(tempFile)) {
                    try { fs.unlinkSync(tempFile); } catch (_) {}
                }
            }
        }



        const form =
            new FormData();


        form.append(
            "image",
            imageBuffer,
            {
                filename,
                contentType: mimetype
            }
        );


        console.log(
            "🤖 Sending image to AI server:",
            process.env.AI_SERVER_URL + "/detect"
        );


        const response =
            await api.post(

                "/detect",

                form,

                {
                    headers: {
                        ...form.getHeaders()
                    },

                    maxContentLength:
                        Infinity,

                    maxBodyLength:
                        Infinity,

                    timeout:
                        120000
                }

            );


        console.log(
            "✅ AI server response:",
            response.status
        );


        return response.data;

    }


    /* ============================================================
       VERIFY RESOLUTION
    ============================================================ */

    static async verifyResolution(
        beforeImage,
        afterImage
    ) {

        const isHf = process.env.AI_SERVER_URL && process.env.AI_SERVER_URL.includes("hf.space");

        if (isHf) {
            console.log("🤖 Running resolution verification via Hugging Face AI Space...");
            try {
                const client = await getGradioClient();
                const predictPromise = client.predict("/verify", [beforeImage, afterImage]);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("AI verification timed out after 25s")), 25000)
                );
                const result = await Promise.race([predictPromise, timeoutPromise]);
                console.log("✅ Hugging Face AI verification response received");
                return result.data[0];
            } catch (err) {
                console.warn("⚠️ Hugging Face AI verification warning:", err.message);
                return {
                    success: true,
                    verified: false,
                    isResolved: false,
                    verificationScore: 0,
                    recommendation: "MANUAL_REVIEW",
                    reason: `AI verification fallback: ${err.message}`,
                    fallback: true
                };
            }
        }

        const response =
            await api.post(

                "/verify",

                {
                    beforeImage,
                    afterImage
                }

            );

        return response.data;

    }



    /* ============================================================
       OCR
    ============================================================ */

    static async extractText(
        imageUrl
    ) {

        const response =
            await api.post(

                "/ocr",

                {
                    imageUrl
                }

            );

        return response.data;

    }

}


module.exports =
    AIGateway;