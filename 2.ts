import { Request, Response } from "express";
import { StandardResponse } from "../../models/standardReponse";
import { config } from "../../config/config";
import { Category } from "../../models/product";
import { ShopperProducts } from "commerce-sdk-isomorphic";

export const categoryList = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response: StandardResponse = {
    success: false,
    message: "Error in fetching data",
  };

  try {
    // Fetch guest user auth token or user auth token
    if (req.headers && !req.headers.authorization) {
      response.message = "Please pass access Token";
      return res.status(401).send(response);
    }

    // Check if the category list is cached in Redis
    const cachedCategoryList = req.cache
      ? await req.cache.get("categoryList")
      : null;
    if (cachedCategoryList) {
      // If cached, parse the cached string to JSON and return the cached category list
      return res.json({
        success: true,
        message: "Categories retrieved from cache",
        data: JSON.parse(cachedCategoryList),
      });
    }

    const authToken = req.headers.authorization;
    const hostHeader = req.headers["x-forwarded-host"];
    let host: string | undefined;

    if (Array.isArray(hostHeader)) {
      host =
        hostHeader.length > 1 ? hostHeader[1].trim() : hostHeader[0].trim();
    } else if (hostHeader?.split(",").length > 1) {
      host = hostHeader.split(",")[1].trim();
    } else {
      host = hostHeader?.trim();
    }

    // Set authorization header
    config.headers["authorization"] = authToken;

    // Initialize search client
    const productClient = new ShopperProducts(config);

    // Generate search query parameters
    const queryParams = {
      ids: "root",
      levels: 4,
    };

    // Perform product search
    const categoryList = await productClient.getCategories({
      parameters: queryParams,
    });

    // Handle case when no products found
    if (categoryList.total === 0) {
      return res.status(404).json({
        message: "No category found under this parent category",
        success: true,
      });
    }

    const detailedResponse = categoriesMapping(categoryList.data, host);

    if (req.cache && detailedResponse?.categories?.length > 0) {
      await req.cache.set("categoryList", JSON.stringify(detailedResponse));
    }

    // Prepare response data
    response.success = true;
    response.message = "Categories retrieved successfully";
    response.data = detailedResponse;

    return res.json(response);
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    response.message = error.message;
    console.error("Error in categories method" + error);
    return res.status(status).json(response);
  }
};

const categoriesMapping = (
  data: any,
  host: any
): { categories: Category[] } => {
  try {
    const updateDomainInUrl = (
      inputString: string,
      newDomain: string
    ): string => {
      return inputString.replace(
        /https?:\/\/([a-zA-Z0-9.-]+)/g,
        (match, domain) => match.replace(domain, newDomain)
      );
    };

    const getRelativeUrl = (url: string | undefined): string => {
      if (!url) return "";
      const protocolIndex = url.indexOf("://");
      if (protocolIndex !== -1) {
        const pathStartIndex = url.indexOf("/", protocolIndex + 3);
        return pathStartIndex !== -1 ? url.substring(pathStartIndex) : "/";
      }
      console.error("Invalid URL format:", url);
      return "";
    };

    const getLink = (id: string, alternativeUrl?: string): string => {
      if (alternativeUrl) {
        return getRelativeUrl(alternativeUrl);
      }
      if (id === "auction-navigation") return "/online-auctions";
      if (id === "livetv") return `/${id}`;
      return `/c/${id}`;
    };

    const mapCategory = (category: any, newDomain: string): Category => {
      const {
        name = "",
        id = "",
        c_showInMenu = false,
        c_categoryMegaMenuImage = "",
        thumbnail = "",
        page_description = "",
        categories = [],
        parentCategoryTree = [],
        c_alternativeUrl,
      } = category;

      return {
        name,
        id,
        showInMenu: c_showInMenu,
        link: getLink(id, c_alternativeUrl),
        parentCategoryTree,
        image: updateDomainInUrl(c_categoryMegaMenuImage, newDomain),
        thumbnail: updateDomainInUrl(thumbnail, newDomain),
        desc: page_description,
        subcategories: categories.map((subCategory: any) =>
          mapCategory(subCategory, newDomain)
        ),
      };
    };

    const newDomain = host === "localhost" ? process.env.DOMAIN : host;

    const mainCategories = (data[0]?.categories || []).filter(
      (category: any) => category?.c_showInMenu
    );

    return {
      categories: mainCategories.map((mainCategory: any) =>
        mapCategory(mainCategory, newDomain)
      ),
    };
  } catch (error) {
    console.error("Error occurred while mapping categories:", error);
    return { categories: [] };
  }
};
