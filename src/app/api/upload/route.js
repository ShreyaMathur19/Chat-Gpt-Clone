import cloudinary from '@/lib/cloudinary';

export async function POST(req) {
    const formData = await req.formData();
    const file = formData.get('file');
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        }).end(buffer);
    });

    return Response.json({ url: result.secure_url });
}
