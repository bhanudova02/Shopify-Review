import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_API_VERSION = "2024-01";
const ALLOWED_ORIGINS = ["https://cwytui-ah.myshopify.com", "http://localhost:3000"];

interface SubmitReviewBody {
  author: string;
  rating: number;
  content: string;
  product_id: string;
}

type ShopifyGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

function getCorsHeaders(origin: string | null) {
  // Allow if no origin (e.g. Postman) or if origin is explicitly allowed
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return null;
  }

  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function corsJson(
  body: Record<string, unknown>,
  status: number,
  origin: string | null
) {
  const headers = getCorsHeaders(origin);
  if (!headers) {
    return NextResponse.json(
      { error: "CORS origin not allowed" },
      { status: 403 }
    );
  }

  return NextResponse.json(body, { status, headers });
}

function getShopifyConfig() {
  const shop = process.env.SHOPIFY_SHOP;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shop || !accessToken) {
    return null;
  }

  return {
    endpoint: `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    accessToken,
  };
}

async function shopifyAdminGraphQL<T>(query: string, variables: Record<string, unknown>) {
  const config = getShopifyConfig();
  if (!config) {
    throw new Error("Missing Shopify credentials");
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const payload = (await response.json()) as ShopifyGraphQLResponse<T>;
  if (!response.ok || payload.errors?.length) {
    const details =
      payload.errors?.map((entry) => entry.message).join("; ") || "Shopify API request failed";
    throw new Error(details);
  }

  return payload.data as T;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = getCorsHeaders(origin);

  if (!headers) {
    return NextResponse.json({ error: "CORS origin not allowed" }, { status: 403 });
  }

  return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    const body = (await request.json()) as Partial<SubmitReviewBody>;
    const author = body.author?.toString().trim() || "";
    const content = body.content?.toString().trim() || "";
    const productId = body.product_id?.toString().trim() || "";
    const numericRating = Number(body.rating);

    if (!author || !content || !productId || Number.isNaN(numericRating)) {
      return corsJson(
        {
          error:
            "Validation failed: author, rating, content, and product_id are required",
        },
        400,
        origin
      );
    }

    if (numericRating < 1 || numericRating > 5) {
      return corsJson(
        { error: "Validation failed: rating must be between 1 and 5" },
        400,
        origin
      );
    }

    const mutation = `
      mutation CreateReviewMetaobject($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject {
            id
            handle
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    type CreateMetaobjectResponse = {
      metaobjectCreate: {
        metaobject: { id: string; handle: string } | null;
        userErrors: Array<{ field: string[] | null; message: string }>;
      };
    };

    const data = await shopifyAdminGraphQL<CreateMetaobjectResponse>(mutation, {
      metaobject: {
        type: "review",
        fields: [
          { key: "author", value: author },
          { key: "rating", value: String(numericRating) },
          { key: "content", value: content },
          { key: "product_id", value: productId },
          // { key: "status", value: "draft" },
          // { key: "approved", value: "false" },
        ],
      },
    });

    const userErrors = data.metaobjectCreate.userErrors;
    if (userErrors.length > 0 || !data.metaobjectCreate.metaobject) {
      return corsJson(
        {
          error: "Failed to create review metaobject",
          details: userErrors.map((entry) => entry.message),
        },
        400,
        origin
      );
    }

    return corsJson(
      {
        success: true,
        message: "Review submitted successfully",
        review: data.metaobjectCreate.metaobject,
      },
      201,
      origin
    );
  } catch (error) {
    const details = error instanceof Error ? error.message : "Internal server error";
    return corsJson(
      {
        error: "Failed to submit review",
        details,
      },
      500,
      origin
    );
  }
}
