import { NextRequest, NextResponse } from "next/server";

const GRAPHQL_URL = "https://cwytui-ah.myshopify.com/admin/api/2024-01/graphql.json";
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || "";

type ReviewNode = {
  id?: string;
  handle?: string;
  fields?: Array<{ key?: string | null; value?: string | null }> | null;
};

export async function GET() {
  try {
    const query = `
      query GetReviewMetaobjects {
        metaobjects(type: "review", first: 250) {
          nodes {
            id
            handle
            fields {
              key
              value
            }
          }
        }
      }
    `;

    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ACCESS_TOKEN,
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Shopify Error:", text);
      throw new Error("Shopify rejected request");
    }

    const json = (await response.json()) as {
      data?: { metaobjects?: { nodes?: ReviewNode[] } };
      errors?: Array<{ message?: string }>;
    };

    if (json.errors?.length) {
      console.error("Shopify Error:", json.errors[0].message || "Unknown GraphQL error");
      throw new Error("Shopify rejected request");
    }

    const nodes = json.data?.metaobjects?.nodes || [];
    console.log("Shopify metaobject nodes:", nodes);

    const getFieldValue = (node: ReviewNode, key: string) => {
      const fields = Array.isArray(node.fields) ? node.fields : [];
      const matched = fields.find(
        (field) => String(field?.key || "").toLowerCase() === key.toLowerCase()
      );
      return matched?.value ?? null;
    };

    const reviews = nodes.map((node) => {
      const approvedValue = (
        getFieldValue(node, "approved") ||
        getFieldValue(node, "Approved") ||
        ""
      ).toLowerCase();
      const isApproved = approvedValue === "true";

      return {
        id: node.id || "",
        handle: node.handle || "",
        status: isApproved ? "Approved" : "Draft",
        author: getFieldValue(node, "author") || "Unknown",
        content: getFieldValue(node, "content") || "Unknown",
        rating: Number(getFieldValue(node, "rating") || 0),
        product_id: getFieldValue(node, "product_id") || "N/A",
        approved: isApproved,
      };
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch reviews",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing review ID" }, { status: 400 });
    }

    if (action !== "approve" && action !== "disable") {
      return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'disable'" }, { status: 400 });
    }

    const isApprove = action === "approve";
    const statusVal = isApprove ? "ACTIVE" : "DRAFT";
    const approvedVal = isApprove ? "true" : "false";

    // Update metaobject status and approved field based on action
    const query = `
      mutation metaobjectUpdate($id: ID!, $metaobject: MetaobjectUpdateInput!) {
        metaobjectUpdate(id: $id, metaobject: $metaobject) {
          metaobject {
            id
            handle
            fields {
              key
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      id,
      metaobject: {
        fields: [
          {
            key: "approved",
            value: approvedVal,
          },
        ],
        capabilities: {
          publishable: {
            status: statusVal,
          },
        },
      },
    };

    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ACCESS_TOKEN,
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Shopify Metaobject Update Error:", text);
      return NextResponse.json({ error: "Shopify rejected request" }, { status: 400 });
    }

    const json = (await response.json()) as any;

    if (json.errors?.length) {
      const err = json.errors[0].message || "Unknown GraphQL error";
      console.error("Shopify Error:", err);
      return NextResponse.json({ error: err }, { status: 400 });
    }

    const updateErrors = json.data?.metaobjectUpdate?.userErrors || [];
    if (updateErrors.length > 0) {
      const err = updateErrors.map((e: any) => e.message).join(", ");
      console.error("Shopify Metaobject Update User Error:", err);
      return NextResponse.json({ error: err }, { status: 400 });
    }

    const metaobject = json.data?.metaobjectUpdate?.metaobject;
    
    // Parse the updated review to return it in flat structure if needed
    let reviewData = { id };
    if (metaobject) {
      const getFieldValue = (node: any, key: string) => {
        const fields = Array.isArray(node.fields) ? node.fields : [];
        const matched = fields.find(
          (field: any) => String(field?.key || "").toLowerCase() === key.toLowerCase()
        );
        return matched?.value ?? null;
      };

      reviewData = {
        id: metaobject.id || id,
        handle: metaobject.handle || "",
        status: isApprove ? "Approved" : "Draft",
        author: getFieldValue(metaobject, "author") || "Unknown",
        content: getFieldValue(metaobject, "content") || "Unknown",
        rating: Number(getFieldValue(metaobject, "rating") || 0),
        product_id: getFieldValue(metaobject, "product_id") || "N/A",
        approved: isApprove,
      } as any;
    }

    return NextResponse.json({ success: true, review: reviewData });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update review",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
