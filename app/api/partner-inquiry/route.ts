import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, email, organization, partnershipType, message } = body;

    // Validate required fields
    if (!name || !email || !partnershipType || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the inquiry (in production, send email or store in database)
    console.log('[SHEMA Partnership Inquiry]', {
      name,
      email,
      organization,
      partnershipType,
      message,
      timestamp: new Date().toISOString(),
    });

    // For now, we'll just return success
    // In production, you'd integrate with:
    // - SendGrid/Mailgun for email notifications
    // - Supabase/database for storing inquiries
    // - Slack webhooks for team notifications

    // 📩 Send email
    const data = await resend.emails.send({
      from: 'Shema <info@shemahumantarianservice.org>', // change later
      to: ['shemahumanitarianservices@gmail.com'], 
      
      subject: `New Partnership Inquiry from ${name}`,
      replyTo: email,
      html: `
        <h2>New Partnership Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Organization:</strong> ${organization || 'N/A'}</p>
        <p><strong>Partnership Type:</strong> ${partnershipType}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });



    await resend.emails.send({
      from: 'Shema <info@shemahumantarianservice.org>',
      to: [email],
      subject: 'We received your inquiry',
      replyTo: `shemahumanitarianservices@gmail.com`,
      html: `
        <p>Hi ${name},</p>
        <p>Thank you for reaching out to Shema Humanitarian.</p>
        <p>We will get back to you shortly.</p>
      `,
    });

    console.log('Email sent:', data);


    return NextResponse.json(
      {
        success: true,
        message: 'Partnership inquiry received successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing partnership inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to process inquiry' },
      { status: 500 }
    );
  }
}
