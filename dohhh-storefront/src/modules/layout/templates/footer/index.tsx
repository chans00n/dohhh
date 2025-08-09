import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Footer } from "../../../../components/ui/footer"

export default async function FooterWrapper() {
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()

  // Filter out subcategories and prepare footer sections
  const mainCategories = productCategories?.filter(c => !c.parent_category) || []

  const footerSections = [
    {
      title: "Shop",
      links: [
        ...mainCategories.slice(0, 4).map(c => ({
          title: c.name,
          href: `/categories/${c.handle}`,
        })),
        { title: "All Products", href: "/store" },
        { title: "New Arrivals", href: "/store" },
      ]
    },
    {
      title: "Collections",
      links: collections?.slice(0, 5).map(c => ({
        title: c.title,
        href: `/collections/${c.handle}`,
      })) || []
    },
    {
      title: "Customer Care",
      links: [
        { title: "Contact Us", href: "/contact" },
        { title: "Shipping & Returns", href: "/shipping" },
        { title: "Size Guide", href: "/size-guide" },
        { title: "Care Instructions", href: "/care" },
        { title: "FAQ", href: "/faq" },
      ]
    },
  ]

  return <Footer sections={footerSections} />
}
