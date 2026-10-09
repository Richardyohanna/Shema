# SHEMA Website Project — Client Handover

**Prepared for:** SHEMA Humanitarian Services  
**Prepared by:** Yohanna Richard Adamu  
**Updated:** October 2026

## 1. Project overview

The SHEMA website is a responsive Next.js web application for presenting the organisation's programmes and impact, publishing news, sharing beneficiary stories and video testimonies, promoting events, receiving enquiries, and accepting online donations.

## 2. Live website and hosting

- **Website:** https://www.shemahumantarianservice.org
- **Admin dashboard:** https://www.shemahumantarianservice.org/admin
- **Hosting/deployment:** Vercel
- **Domain registrar:** Spaceship — https://spaceship.com
- **Domain renewal date recorded in the earlier handover:** 9 April 2027
- **Database, media storage, and backend services:** Supabase
- **Email delivery:** Resend
- **Payment provider:** Paystack

The original handover lists the contact-form destination as `info@shemahumantarianservice.org`. Confirm that this remains the correct operational inbox before final client sign-off.

## 3. Admin dashboard and access

Open the admin dashboard URL and sign in with the administrator credentials supplied securely by the organisation. The dashboard password is intentionally **not included in this document or in the repository**.

Access is for authorised SHEMA administrators only. Public website visitors cannot create or publish posts from the dashboard.

### Dashboard sections

The dashboard currently provides these sections:

1. **News Management** — create, view, edit, and delete news posts.
2. **Video Testimonies** — manage beneficiary/community stories and video testimonies.
3. **Events** — create, edit, filter, publish, and delete events.

Services are managed through the site's service content and linked to relevant testimonies and events.

### Creating a news post

1. Open the admin dashboard and sign in.
2. Select **News Management**.
3. Select **New Post**.
4. Complete the required fields:
   - **Title:** the headline displayed on the website.
   - **Excerpt:** a short summary for cards and previews.
   - **Content:** the main article text.
   - **Category:** select the relevant category, such as Programs, Community Outreach, Education, Partnership, or Event.
   - **Publish Date:** choose the date to display for the post.
   - **Image:** select a suitable image from your computer. An image is required when creating a new post.
5. Review the information and select **Create Post**.
6. Confirm that the post appears correctly on the public website.

The image is uploaded to the Supabase Storage `site-media` bucket in the news area. The site stores the resulting image URL with the news record and also records it for the gallery. Use images that SHEMA has permission to publish, with clear filenames and suitable dimensions. If editing an existing post, the image can be left unchanged; upload a replacement only when needed.

### Editing or deleting a news post

- Use the post's **Edit** action to update its title, excerpt, content, category, publish date, or image.
- Use **Delete** only after confirming that the correct post is selected. Deletion is intended to remove the post and should be treated as a permanent content change.
- Check the live page after important changes.

## 4. Video testimonies and beneficiary stories

The **Video Testimonies** section supports creating and managing story records. Depending on the story, the form can include:

- Person's name and role
- Story title
- Short description/summary and full story
- Related service
- Related event, where applicable
- Video source: an uploaded video or a URL
- Video URL
- Thumbnail image or thumbnail URL
- Thumbnail alternative text (a short accessible description of the thumbnail)
- Supporting/story image
- Display order
- Published/draft status

### Adding a testimony

1. Open **Video Testimonies** and start a new item.
2. Enter the person's/story's details and a concise summary.
3. Select the related service and, where appropriate, a related event.
4. Choose the video source:
   - **Upload:** select a local video file.
   - **URL:** provide a valid video URL. YouTube links are supported, as are supported direct video-file links.
5. Add a thumbnail by uploading an image or entering its URL, and write meaningful thumbnail alt text.
6. Add a supporting image if needed, set the display order, and choose whether the item should be published.
7. Save and verify the result on the relevant public service page.

The upload form accepts MP4, MOV, WebM, or Ogg video files and JPEG, PNG, or WebP images. The application code permits video files up to 500 MB and images up to 12 MB, but the actual upload size is also subject to the Supabase project's and bucket's configured limits. If an upload fails with a size-limit error, check those limits or compress the media. For large videos, a hosted video URL may be more practical.

Only publish stories and images for which SHEMA has obtained the appropriate permission/consent. Avoid including sensitive personal information in a public story unless the organisation has explicitly approved it.

## 5. Events and service linking

The **Events** section supports creating, editing, filtering, publishing, and deleting events. Event details include:

- Event title and URL slug
- Date and location
- Description
- Cover image URL
- Gallery image URLs (one URL per line in the form)
- Related service
- Published/draft status

To add an event, open **Events**, start a new event, complete the details, select the related service, add a cover image and any gallery URLs, choose its publication status, and save. The slug should be URL-friendly (for example, `community-outreach-2026`) and unique within the selected service.

Published events and published testimonies can appear on their related service pages. Linking a testimony to the relevant service/event helps visitors understand the context of the story.

## 6. Donations and Paystack integration

The website's donation form integrates with Paystack and provides **Nigerian Naira (NGN)** and **US Dollars (USD)** as currency options.

### Donation flow

1. A donor enters their name, email, currency, amount, and an optional message.
2. The server validates the details and creates a pending donation record in Supabase.
3. The server requests a Paystack checkout URL and sends the donor to Paystack to complete payment.
4. After checkout, the website verifies the transaction with Paystack before treating it as successful.
5. A signed Paystack webhook can also notify the site of a successful charge. The webhook signature is checked before processing.
6. The donation record is updated with the transaction outcome, and the system can send a thank-you email through the configured email service.

The system checks that the verified transaction reference, amount, and currency match the stored donation before marking it successful. Donors should not be told a payment succeeded based only on returning to the website; the verification result is what matters.

### Currency and payment availability

The application validates donation amounts in the selected currency. Current code limits are **₦100–₦10,000,000 for NGN** and **$1–$10,000 for USD**. Actual availability also depends on Paystack account configuration and the currency/payment methods enabled for the organisation. If Paystack reports that USD is unsupported for the account, USD donations may be temporarily unavailable and the donor should select NGN until the account is configured.

### Payment operations and troubleshooting

- Check Vercel function logs for server-side errors; do not share raw logs containing donor information.
- Confirm the Paystack secret key is configured in the production environment.
- Confirm the production site URL is configured correctly so payment callbacks/return links use the live website.
- Confirm the Supabase donations table and service-role access are configured.
- Confirm the Paystack webhook points to the deployed webhook endpoint and that the secret key used to validate the signature is correct.
- Confirm the email provider is configured if thank-you emails are not being sent.
- Use Paystack's dashboard and transaction reference to investigate payment disputes. Do not manually mark a donation successful without verifying it with Paystack.

## 7. Environment variables and security

The application uses environment variables for private credentials and service configuration. Production values should be maintained in **Vercel Project Settings → Environment Variables** and, for local development, in a local `.env.local` file that is excluded from Git.

Variables used by the current implementation include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (if required by the client-side Supabase client)
- `SUPABASE_SERVICE_ROLE_KEY` — privileged server-side key; never expose it in browser code or commit it to Git.
- `ADMIN_PASSWORD` — administrator password used by the dashboard/API.
- `PAYSTACK_SECRET_KEY` — private Paystack API key.
- `SITE_URL` or `NEXT_PUBLIC_SITE_URL` — production website URL used when building payment return URLs.
- `RESEND_API_KEY` — email delivery credential, where configured.

Use the exact variable names expected by the deployed code. Never place passwords, API keys, service-role keys, or other secrets in this handover, public source files, screenshots, or Git commits. Because the old handover contained an admin password, rotate it and update the production `ADMIN_PASSWORD` value before handing access to the client. Share the replacement password through a separate secure channel.

## 8. Technology stack

- **Frontend and application framework:** React, TypeScript, Next.js
- **Styling and UI:** Tailwind CSS and reusable UI components
- **Database and storage:** Supabase (PostgreSQL and Storage)
- **Deployment:** Vercel
- **Domain registrar:** Spaceship
- **Email delivery:** Resend
- **Online donations:** Paystack
- **Design reference:** Figma

## 9. Updating other website content

- **News, testimonies, and events:** use the admin dashboard where the relevant management section is available.
- **Service descriptions and structured content:** use the service-management workflow available to authorised administrators or request a developer update if the required field is not exposed in the dashboard.
- **Contact details, navigation, layout, and static page copy:** some items may still be maintained in the source code. Update the relevant component, test locally, and redeploy through the project's deployment workflow.
- **Images and media:** prefer the dashboard's upload workflow or approved hosted URLs. Do not commit large video files to Git; use Supabase Storage or a suitable video-hosting service.
- **After each change:** verify desktop and mobile layouts, links, images, forms, and any related public service page.

## 10. Deployment and maintenance

The website is deployed on Vercel and uses Supabase for database/media services. When changes are merged into the production branch, Vercel may deploy them automatically according to the project's configuration. Confirm the configured production branch and deployment status in Vercel.

Recommended maintenance checklist:

- Keep domain registration and payment-provider account details current.
- Review donation records and reconcile successful payments against Paystack.
- Check form submissions and email delivery.
- Keep administrator access limited to trusted staff and rotate credentials when staff access changes.
- Back up important content and database data.
- Test new posts, image/video uploads, events, and donation flows after significant changes.
- Keep dependencies updated and review Vercel/Supabase logs when errors occur.

## 11. Known configuration checks before final sign-off

- Confirm the contact-form recipient email is still correct.
- Confirm the production website URL and Vercel environment variables.
- Confirm Supabase Storage file-size limits are suitable for the organisation's videos.
- Confirm Paystack account support for both NGN and USD and test a transaction in the appropriate mode.
- Confirm the production webhook endpoint is configured in Paystack.
- Confirm an authorised administrator can sign in after the admin password has been rotated.

## 12. Support and contact

For content-management guidance, deployment questions, bug fixes, or further enhancements, contact the developer:

**Yohanna Richard Adamu**  
Phone: +234 912 948 5335 / +234 916 121 6009  
Email: yohanrichard091@gmail.com  
LinkedIn: https://www.linkedin.com/in/fullstackdeveloper-richardyohanna

---

This handover describes the repository's current implementation as reviewed in October 2026. Features that depend on third-party account settings (including payment currency support, upload limits, email delivery, and production environment variables) must also be verified in those services.
