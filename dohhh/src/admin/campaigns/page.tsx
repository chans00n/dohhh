import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Button, Container, Heading, Table, Badge, Text, Toaster, toast } from "@medusajs/ui"
import { useState } from "react"
import { Plus, PencilSquare, Trash } from "@medusajs/icons"
import { Link } from "react-router-dom"

const CampaignsPage = () => {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch campaigns
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const response = await fetch("/admin/campaigns", {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch campaigns")
      return response.json()
    },
  })

  // Delete campaign mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/admin/campaigns/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to delete campaign")
    },
    onSuccess: () => {
      toast.success("Campaign deleted successfully")
      refetch()
      setDeletingId(null)
    },
    onError: () => {
      toast.error("Failed to delete campaign")
      setDeletingId(null)
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
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <Container>
        <div className="flex h-[400px] w-full items-center justify-center">
          <Text>Loading campaigns...</Text>
        </div>
      </Container>
    )
  }

  const campaigns = data?.campaigns || []

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <Heading level="h1">Fundraising Campaigns</Heading>
        <Link to="/campaigns/new">
          <Button variant="primary" size="small">
            <Plus />
            Create Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex h-[400px] w-full items-center justify-center flex-col gap-4">
          <Text size="large" className="text-ui-fg-muted">
            No campaigns found
          </Text>
          <Link to="/campaigns/new">
            <Button variant="primary">Create your first campaign</Button>
          </Link>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Title</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Goal</Table.HeaderCell>
              <Table.HeaderCell>Raised</Table.HeaderCell>
              <Table.HeaderCell>Progress</Table.HeaderCell>
              <Table.HeaderCell>End Date</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {campaigns.map((campaign: any) => {
              const progress = campaign.stats
                ? (campaign.stats.total_raised / campaign.goal_amount) * 100
                : 0

              return (
                <Table.Row key={campaign.id}>
                  <Table.Cell>
                    <Text weight="plus">{campaign.title}</Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      {campaign.cause_name}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>{getStatusBadge(campaign.status)}</Table.Cell>
                  <Table.Cell>{formatCurrency(campaign.goal_amount)}</Table.Cell>
                  <Table.Cell>
                    {campaign.stats
                      ? formatCurrency(campaign.stats.total_raised)
                      : "$0.00"}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-ui-bg-field rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-ui-tag-green-bg transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <Text size="small">{progress.toFixed(0)}%</Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>{formatDate(campaign.end_date)}</Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <Link to={`/campaigns/${campaign.id}/edit`}>
                        <Button variant="transparent" size="small">
                          <PencilSquare />
                        </Button>
                      </Link>
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() => {
                          setDeletingId(campaign.id)
                          if (confirm("Are you sure you want to delete this campaign?")) {
                            deleteMutation.mutate(campaign.id)
                          } else {
                            setDeletingId(null)
                          }
                        }}
                        disabled={deletingId === campaign.id}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      )}
      <Toaster />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Campaigns",
  icon: () => "📢",
})

export default CampaignsPage