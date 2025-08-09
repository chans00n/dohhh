import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useQuery, useMutation } from "@tanstack/react-query"
import {
  Button,
  Container,
  Heading,
  Input,
  Textarea,
  Select,
  Label,
  DatePicker,
  toast,
  Toaster,
  Text,
} from "@medusajs/ui"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { ArrowLeft } from "@medusajs/icons"

const EditCampaignPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    story_content: "",
    goal_amount: "",
    goal_cookies: "",
    start_date: new Date(),
    end_date: new Date(),
    status: "draft",
    featured_image_url: "",
    cause_name: "",
    impact_content: "",
    video_url: "",
    about_image_url: "",
  })

  // Fetch campaign data
  const { data, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const response = await fetch(`/admin/campaigns/${id}`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch campaign")
      return response.json()
    },
  })

  // Update form data when campaign is loaded
  useEffect(() => {
    if (data?.campaign) {
      const campaign = data.campaign
      setFormData({
        title: campaign.title || "",
        description: campaign.description || "",
        story_content: campaign.story_content || "",
        goal_amount: (campaign.goal_amount / 100).toString(), // Convert from cents
        goal_cookies: campaign.goal_cookies?.toString() || "",
        start_date: new Date(campaign.start_date),
        end_date: new Date(campaign.end_date),
        status: campaign.status || "draft",
        featured_image_url: campaign.featured_image_url || "",
        cause_name: campaign.cause_name || "",
        impact_content: campaign.impact_content || "",
        video_url: campaign.video_url || "",
        about_image_url: campaign.about_image_url || "",
      })
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/admin/campaigns/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          goal_amount: Math.round(parseFloat(data.goal_amount) * 100), // Convert to cents
          goal_cookies: parseInt(data.goal_cookies),
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update campaign")
      }
      return response.json()
    },
    onSuccess: (data) => {
      console.log("[CAMPAIGN EDIT] Update successful:", data)
      toast.success("Campaign updated successfully")
      navigate(`/campaigns/${id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update campaign")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[CAMPAIGN EDIT] Submitting form data:", formData)
    console.log("[CAMPAIGN EDIT] Goal amount in dollars:", formData.goal_amount)
    console.log("[CAMPAIGN EDIT] Goal amount in cents:", Math.round(parseFloat(formData.goal_amount) * 100))
    updateMutation.mutate(formData)
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <Container>
        <div className="flex h-[400px] w-full items-center justify-center">
          <Text>Loading campaign...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="transparent"
          size="small"
          onClick={() => navigate("/campaigns")}
        >
          <ArrowLeft />
        </Button>
        <Heading level="h1">Edit Campaign</Heading>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label htmlFor="title" size="small" weight="plus">
              Campaign Title*
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter campaign title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description" size="small" weight="plus">
              Short Description*
            </Label>
            <Textarea
              id="description"
              placeholder="Brief description for preview cards"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="story_content" size="small" weight="plus">
              Full Description
            </Label>
            <Textarea
              id="story_content"
              placeholder="Detailed campaign story and information"
              value={formData.story_content}
              onChange={(e) => handleChange("story_content", e.target.value)}
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="goal_amount" size="small" weight="plus">
                Fundraising Goal ($)*
              </Label>
              <Input
                id="goal_amount"
                type="number"
                step="0.01"
                placeholder="5000.00"
                value={formData.goal_amount}
                onChange={(e) => handleChange("goal_amount", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="goal_cookies" size="small" weight="plus">
                Cookie Goal*
              </Label>
              <Input
                id="goal_cookies"
                type="number"
                placeholder="10000"
                value={formData.goal_cookies}
                onChange={(e) => handleChange("goal_cookies", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date" size="small" weight="plus">
                Start Date*
              </Label>
              <DatePicker
                value={formData.start_date}
                onChange={(date) => handleChange("start_date", date)}
              />
            </div>

            <div>
              <Label htmlFor="end_date" size="small" weight="plus">
                End Date*
              </Label>
              <DatePicker
                value={formData.end_date}
                onChange={(date) => handleChange("end_date", date)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status" size="small" weight="plus">
              Status*
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
            >
              <Select.Trigger>
                <Select.Value placeholder="Select status" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="draft">Draft</Select.Item>
                <Select.Item value="active">Active</Select.Item>
                <Select.Item value="completed">Completed</Select.Item>
                <Select.Item value="cancelled">Cancelled</Select.Item>
              </Select.Content>
            </Select>
          </div>

          <div>
            <Label htmlFor="cause_name" size="small" weight="plus">
              Cause Name*
            </Label>
            <Input
              id="cause_name"
              type="text"
              placeholder="e.g., Local Food Bank"
              value={formData.cause_name}
              onChange={(e) => handleChange("cause_name", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="impact_content" size="small" weight="plus">
              Impact Description
            </Label>
            <Textarea
              id="impact_content"
              placeholder="Describe how the funds will be used and the impact"
              value={formData.impact_content}
              onChange={(e) => handleChange("impact_content", e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="featured_image_url" size="small" weight="plus">
              Featured Image URL
            </Label>
            <Input
              id="featured_image_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.featured_image_url}
              onChange={(e) => handleChange("featured_image_url", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="video_url" size="small" weight="plus">
              Video URL
            </Label>
            <Input
              id="video_url"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={formData.video_url}
              onChange={(e) => handleChange("video_url", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="about_image_url" size="small" weight="plus">
              About Section Image URL
            </Label>
            <Input
              id="about_image_url"
              type="url"
              placeholder="https://example.com/about-image.jpg"
              value={formData.about_image_url}
              onChange={(e) => handleChange("about_image_url", e.target.value)}
            />
            <Text className="text-xs text-ui-fg-subtle mt-1">
              This image will be displayed in the About section if no video URL is provided
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-6 border-t">
          <Button type="submit" variant="primary" isLoading={updateMutation.isPending}>
            Save Changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/campaigns")}
          >
            Cancel
          </Button>
        </div>
      </form>
      <Toaster />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Edit Campaign",
})

export default EditCampaignPage