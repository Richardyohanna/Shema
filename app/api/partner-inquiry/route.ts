import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-admin';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, organization, partnershipType, message } = body;

    if (!name || !email || !partnershipType || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { error: dbError } = await supabaseAdmin
      .from('partnership_inquiries')
      .insert({
        name,
        email,
        organization: organization || null,
        partnership_type: partnershipType,
        message,
      });

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 });
    }

    await resend.emails.send({
      from: 'Shema <info@shemahumantarianservice.org>',
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
      replyTo: 'shemahumanitarianservices@gmail.com',
      html: `
        <p>Hi ${name},</p>
        <p>Thank you for reaching out to Shema Humanitarian.</p>
        <p>We will get back to you shortly.</p>
      `,
    });

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