"use client";

import type React from "react";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateChallengeDialog({
  isOpen,
  onClose,
  handleSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  handleSubmit: () => void;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "intermediate",
    duration: "7",
    entryFee: "",
    prizePool: "",
    maxParticipants: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  //   const handleSubmit = () => {
  //     console.log("[v0] Challenge created:", formData);
  //     setFormData({
  //       title: "",
  //       description: "",
  //       difficulty: "intermediate",
  //       duration: "7",
  //       entryFee: "",
  //       prizePool: "",
  //       maxParticipants: "",
  //     });
  //     setStep(1);
  //     onClose();
  //   };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Create Challenge
            </h2>
            <p className="text-sm text-slate-600">Step {step} of 2</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="title"
                  className="text-sm font-bold text-slate-900 mb-2 block"
                >
                  Challenge Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., 30-Day Plank Challenge"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              <div>
                <Label
                  htmlFor="description"
                  className="text-sm font-bold text-slate-900 mb-2 block"
                >
                  Description
                </Label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="What's this challenge about?"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="difficulty"
                    className="text-sm font-bold text-slate-900 mb-2 block"
                  >
                    Difficulty
                  </Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) =>
                      handleSelectChange("difficulty", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="duration"
                    className="text-sm font-bold text-slate-900 mb-2 block"
                  >
                    Duration (days)
                  </Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) =>
                      handleSelectChange("duration", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="entryFee"
                    className="text-sm font-bold text-slate-900 mb-2 block"
                  >
                    Entry Fee ($)
                  </Label>
                  <Input
                    id="entryFee"
                    name="entryFee"
                    type="number"
                    placeholder="5"
                    value={formData.entryFee}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="prizePool"
                    className="text-sm font-bold text-slate-900 mb-2 block"
                  >
                    Prize Pool ($)
                  </Label>
                  <Input
                    id="prizePool"
                    name="prizePool"
                    type="number"
                    placeholder="500"
                    value={formData.prizePool}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="maxParticipants"
                  className="text-sm font-bold text-slate-900 mb-2 block"
                >
                  Max Participants
                </Label>
                <Input
                  id="maxParticipants"
                  name="maxParticipants"
                  type="number"
                  placeholder="100"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-primary">Pro tip:</span>{" "}
                  Higher prize pools attract more participants!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-2 border-gray-300 text-slate-900 hover:bg-gray-50 font-bold bg-transparent"
          >
            Cancel
          </Button>
          {step === 2 && (
            <Button
              onClick={() => setStep(1)}
              className="border-2 border-gray-300 text-slate-900 hover:bg-gray-50 font-bold"
            >
              Back
            </Button>
          )}
          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              className="bg-primary hover:bg-primary/90 text-white font-bold"
            >
              Next
            </Button>
          )}
          {step === 2 && (
            <Button
              onClick={handleSubmit}
              className="bg-secondary hover:bg-secondary/90 text-white font-bold"
            >
              Create Challenge
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
