'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerModal({ open, onOpenChange }: PartnerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    partnershipType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, partnershipType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send email via API route
      const response = await fetch('/api/partner-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          organization: '',
          partnershipType: '',
          message: '',
        });
        setTimeout(() => {
          setSubmitted(false);
          onOpenChange(false);
        }, 2000);
      } else {
        alert('Failed to submit form. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-white/10 backdrop-blur-lg" />
      <DialogContent className="sm:max-w-[550px] bg-white shadow-2xl rounded-2xl border-0 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Section with Gradient */}
        <DialogHeader className="bg-gradient-to-r from-secondary to-secondary/80 p-8 text-white rounded-t-2xl space-y-2 border-0">
          <DialogTitle className="text-3xl font-bold text-white">Partner With SHEMA</DialogTitle>
          <DialogDescription className="text-white/90 text-base">
            Join us in making a difference. Fill in your details and let&apos;s build a partnership that transforms lives.
          </DialogDescription>
        </DialogHeader>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-8">
          {submitted ? (
            <div className="text-center py-12">
              <div className="mb-4 text-6xl text-primary">✓</div>
              <h3 className="text-2xl font-bold text-secondary mb-2">Thank You for Your Interest!</h3>
              <p className="text-foreground/70 text-base leading-relaxed">
                We&apos;ve received your partnership inquiry. Our team will review your details and contact you within 48 hours to discuss how we can work together.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Full Name <span className="text-primary">*</span>
                  </label>
                  <Input
                    name="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 h-11 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Email Address <span className="text-primary">*</span>
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 h-11 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Organization/Company
                </label>
                <Input
                  name="organization"
                  placeholder="Your organization name"
                  value={formData.organization}
                  onChange={handleChange}
                  className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 h-11 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Partnership Type <span className="text-primary">*</span>
                </label>
                <Select value={formData.partnershipType} onValueChange={handleSelectChange}>
                  <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 h-11 rounded-lg">
                    <SelectValue placeholder="Select how you'd like to partner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentorship">Mentorship Programs</SelectItem>
                    <SelectItem value="outreach">Community Outreaches</SelectItem>
                    <SelectItem value="monetary">Monetary Donations</SelectItem>
                    <SelectItem value="in-kind">In-Kind Donations</SelectItem>
                    <SelectItem value="sponsorship">Sponsorship</SelectItem>
                    <SelectItem value="prayer">Prayers & Advocacy</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Message <span className="text-primary">*</span>
                </label>
                <Textarea
                  name="message"
                  placeholder="Tell us more about your partnership interest and how you'd like to contribute..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 min-h-[120px] resize-none rounded-lg"
                />
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-6"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Partnership Inquiry'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
