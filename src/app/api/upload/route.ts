import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    // Allow uploads during onboarding before the user has an authenticated session.
    // Authentication is optional here because uploads are stored in Cloudinary and
    // the returned URL is used in the onboarding payload to create profiles.
    // If you want to restrict uploads later, add validation or signed uploads.
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed" 
      }, { status: 400 });
    }

    // Check file size (10MB limit for documents)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    // Store original filename
    const originalFilename = file.name;
    
    // Extract file extension
    const fileExtension = originalFilename.split('.').pop()?.toLowerCase() || '';
    
    // Sanitize filename: remove special characters, replace spaces with underscores
    const sanitizedFilename = originalFilename
      .replace(/[^a-zA-Z0-9.\-_\s]/g, '') // Remove special chars
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/\.+/g, '.'); // Replace multiple dots with single dot

    console.log("Uploading file:", {
      name: originalFilename,
      sanitizedName: sanitizedFilename,
      type: file.type,
      size: file.size,
      extension: fileExtension
    });

    // Convert file to base64 for Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64File}`;

    // Determine resource type based on file type
    let resourceType: string;
    let uploadEndpoint: string;
    
    if (file.type === 'application/pdf') {
      resourceType = 'raw'; // PDFs must be uploaded as raw
      uploadEndpoint = 'raw';
    } else if (file.type.startsWith('image/')) {
      resourceType = 'image';
      uploadEndpoint = 'image';
    } else {
      resourceType = 'raw';
      uploadEndpoint = 'raw';
    }

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', dataURI);
    cloudinaryFormData.append(
      'upload_preset',
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );
    cloudinaryFormData.append('resource_type', resourceType);
    cloudinaryFormData.append('folder', 'documents');
    cloudinaryFormData.append('filename_override', sanitizedFilename); // Keep full filename with extension

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${uploadEndpoint}/upload`,
      {
        method: "POST",
        body: cloudinaryFormData,
      }
    );


    if (!cloudinaryResponse.ok) {
      const error = await cloudinaryResponse.json();
      console.error("Cloudinary error:", error);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    const cloudinaryData = await cloudinaryResponse.json();
    
    // For raw files (PDFs), ensure the URL includes the extension
    let secureUrl = cloudinaryData.secure_url;
    if (resourceType === 'raw' && !secureUrl.endsWith(`.${fileExtension}`)) {
      secureUrl = `${secureUrl}.${fileExtension}`;
    }
    
    console.log("Upload successful:", {
      url: secureUrl,
      resource_type: cloudinaryData.resource_type,
      format: cloudinaryData.format || fileExtension
    });
    
    return NextResponse.json({
      url: secureUrl,
      publicId: cloudinaryData.public_id,
      format: cloudinaryData.format || fileExtension,
      resourceType: cloudinaryData.resource_type,
      originalFilename: originalFilename
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
