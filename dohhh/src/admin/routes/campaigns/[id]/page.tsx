import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useQuery } from "@tanstack/react-query"
import {
  Button,
  Container,
  Heading,
  Badge,
  Text,
  Tabs,
  Table,
} from "@medusajs/ui"
import { useNavigate, useParams, Link } from "react-router-dom"
import { ArrowLeft, PencilSquare, EllipsisHorizontal } from "@medusajs/icons"

const CampaignDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  // Fetch campaign data
  const { data, isLoading } = useQuery({
    queryKey: ["campaign-detail", id],
    queryFn: async () => {
      const response = await fetch(`/admin/campaigns/${id}`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch campaign")
      return response.json()
    },
  })

  // Fetch contributions data
  const { data: contributionsData } = useQuery({
    queryKey: ["campaign-contributions", id],
    queryFn: async () => {
      const response = await fetch(`/admin/campaigns/${id}/contributions`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch contributions")
      return response.json()
    },
  })

  const getStatusBadge = (status: string) => {
    const colorMap = {
      draft: "grey",
      active: "green",
      completed: "blue",
      cancelled: "red",
    }
    return <Badge color={colorMap[status] || "grey"}>{status}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
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

  const campaign = data?.campaign
  const stats = campaign?.stats
  const progress = stats ? (stats.total_raised / campaign.goal_amount) * 100 : 0

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="transparent"
            size="small"
            onClick={() => navigate("/campaigns")}
          >
            <ArrowLeft />
          </Button>
          <Heading level="h1">{campaign?.title}</Heading>
          {getStatusBadge(campaign?.status || "draft")}
        </div>
        <Link to={`/campaigns/${id}/edit`}>
          <Button variant="secondary" size="small">
            <PencilSquare />
            Edit Campaign
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="contributions">
            Contributions {contributionsData?.contributions?.length ? `(${contributionsData.contributions.length})` : ""}
          </Tabs.Trigger>
          <Tabs.Trigger value="details">Details</Tabs.Trigger>
          <Tabs.Trigger value="milestones">Milestones</Tabs.Trigger>
          <Tabs.Trigger value="updates">Updates</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-ui-bg-base rounded-lg border p-6">
              <Heading level="h3" className="mb-4">Progress</Heading>
              <div>
                <div className="space-y-4">
                  <div>
                    <Text size="small" className="text-ui-fg-subtle">
                      Amount Raised
                    </Text>
                    <Text size="xlarge" weight="plus">
                      {stats ? formatCurrency(stats.total_raised) : "$0.00"}
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      of {formatCurrency(campaign?.goal_amount || 0)} goal
                    </Text>
                  </div>
                  <div className="w-full bg-ui-bg-field rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-ui-tag-green-bg transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <Text size="small">{progress.toFixed(1)}% funded</Text>
                </div>
              </div>
            </div>

            <div className="bg-ui-bg-base rounded-lg border p-6">
              <Heading level="h3" className="mb-4">Supporters</Heading>
              <div>
                <div className="space-y-4">
                  <div>
                    <Text size="xlarge" weight="plus">
                      {stats?.total_backers || 0}
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      Total Backers
                    </Text>
                  </div>
                  <div>
                    <Text size="large" weight="plus">
                      {stats ? formatCurrency(stats.average_contribution) : "$0.00"}
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      Average Contribution
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-ui-bg-base rounded-lg border p-6">
              <Heading level="h3" className="mb-4">Cookie Sales</Heading>
              <div>
                <div className="space-y-4">
                  <div>
                    <Text size="xlarge" weight="plus">
                      {stats?.total_cookies_sold || 0}
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      Cookies Sold
                    </Text>
                  </div>
                  <div>
                    <Text size="large" weight="plus">
                      {campaign?.goal_cookies || 0}
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      Cookie Goal
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-ui-bg-base rounded-lg border p-6">
              <Heading level="h3" className="mb-4">Campaign Duration</Heading>
              <div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text size="small" className="text-ui-fg-subtle">
                      Start Date
                    </Text>
                    <Text size="small">
                      {campaign?.start_date ? formatDate(campaign.start_date) : "-"}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="small" className="text-ui-fg-subtle">
                      End Date
                    </Text>
                    <Text size="small">
                      {campaign?.end_date ? formatDate(campaign.end_date) : "-"}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text size="small" className="text-ui-fg-subtle">
                      Days Remaining
                    </Text>
                    <Text size="small" weight="plus">
                      {stats?.days_remaining || 0} days
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-ui-bg-base rounded-lg border p-6">
              <Heading level="h3" className="mb-4">Last Updated</Heading>
              <div>
                <Text size="small">
                  {stats?.last_updated
                    ? formatDateTime(stats.last_updated)
                    : "No updates yet"}
                </Text>
              </div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="contributions" className="mt-6">
          <div className="bg-ui-bg-base rounded-lg border">
            <div className="p-6 border-b">
              <Heading level="h3">Campaign Contributions</Heading>
            </div>
            <div>
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Date</Table.HeaderCell>
                    <Table.HeaderCell>Contributor</Table.HeaderCell>
                    <Table.HeaderCell>Email</Table.HeaderCell>
                    <Table.HeaderCell>Amount</Table.HeaderCell>
                    <Table.HeaderCell>Cookies</Table.HeaderCell>
                    <Table.HeaderCell>Order</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {contributionsData?.contributions?.length ? (
                    contributionsData.contributions.map((contribution: any) => (
                      <Table.Row key={contribution.id}>
                        <Table.Cell>
                          {formatDateTime(contribution.created_at)}
                        </Table.Cell>
                        <Table.Cell>
                          {contribution.is_anonymous ? (
                            <Text className="text-ui-fg-subtle italic">Anonymous</Text>
                          ) : (
                            contribution.contributor_name || 
                            contribution.customer?.first_name + " " + contribution.customer?.last_name ||
                            "N/A"
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          {contribution.contributor_email || contribution.customer?.email || "-"}
                        </Table.Cell>
                        <Table.Cell>
                          <Text weight="plus">{formatCurrency(parseInt(contribution.amount))}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          {contribution.cookies_purchased || 0}
                        </Table.Cell>
                        <Table.Cell>
                          {contribution.order_id ? (
                            <Link
                              to={`/orders/${contribution.order_id}`}
                              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                            >
                              {contribution.order?.display_id || contribution.order_id.slice(-6)}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color={contribution.status === "completed" ? "green" : "grey"}>
                            {contribution.status}
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  ) : (
                    <Table.Row>
                      <Table.Cell colSpan={7} className="text-center py-8">
                        <Text className="text-ui-fg-subtle">No contributions yet</Text>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
              {contributionsData?.contributions?.length > 0 && (
                <div className="p-4 border-t">
                  <div className="flex justify-between items-center">
                    <Text size="small" className="text-ui-fg-subtle">
                      Total: {contributionsData.contributions.length} contributions
                    </Text>
                    <Text size="small" weight="plus">
                      Total raised: {formatCurrency(
                        contributionsData.contributions.reduce((sum: number, c: any) => 
                          sum + parseInt(c.amount), 0
                        )
                      )}
                    </Text>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="details" className="mt-6">
          <div className="bg-ui-bg-base rounded-lg border p-6">
            <div className="space-y-6">
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-subtle mb-1">
                  Description
                </Text>
                <Text>{campaign?.description || "No description provided"}</Text>
              </div>

              <div>
                <Text size="small" weight="plus" className="text-ui-fg-subtle mb-1">
                  Long Description
                </Text>
                <Text className="whitespace-pre-wrap">
                  {campaign?.long_description || "No detailed description provided"}
                </Text>
              </div>

              <div>
                <Text size="small" weight="plus" className="text-ui-fg-subtle mb-1">
                  Cause
                </Text>
                <Text weight="plus">{campaign?.cause_name || "-"}</Text>
                <Text size="small" className="text-ui-fg-subtle mt-1">
                  {campaign?.cause_description || "No cause description provided"}
                </Text>
              </div>

              <div>
                <Text size="small" weight="plus" className="text-ui-fg-subtle mb-1">
                  Impact
                </Text>
                <Text>{campaign?.impact_description || "No impact description provided"}</Text>
              </div>

              {campaign?.featured_image_url && (
                <div>
                  <Text size="small" weight="plus" className="text-ui-fg-subtle mb-1">
                    Featured Image
                  </Text>
                  <img
                    src={campaign.featured_image_url}
                    alt="Campaign featured image"
                    className="max-w-md rounded-lg"
                  />
                </div>
              )}

              {campaign?.video_url && (
                <div>
                  <Text size="small" weight="plus" className="text-ui-fg-subtle mb-1">
                    Video URL
                  </Text>
                  <a
                    href={campaign.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                  >
                    {campaign.video_url}
                  </a>
                </div>
              )}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="milestones" className="mt-6">
          <div className="bg-ui-bg-base rounded-lg border p-6">
              <Text className="text-ui-fg-subtle">
                Milestones feature coming soon...
              </Text>
          </div>
        </Tabs.Content>

        <Tabs.Content value="updates" className="mt-6">
          <div className="bg-ui-bg-base rounded-lg border p-6">
              <Text className="text-ui-fg-subtle">
                Campaign updates feature coming soon...
              </Text>
          </div>
        </Tabs.Content>
      </Tabs>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Campaign Details",
})

export default CampaignDetailPage