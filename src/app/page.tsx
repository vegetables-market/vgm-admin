import ImageUploader from "@/components/ImageUploader";

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center gap-8 py-16 px-8 bg-white dark:bg-black">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50 mb-2">
                        vgm-admin
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Image Upload to AWS S3
                    </p>
                </div>
                <ImageUploader />
            </main>
        </div>
    );
}
