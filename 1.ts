import { generateGenericName, slugify } from "../../utils/commonFunctions";

/**
 * Safely maps over an array or returns an empty array if undefined or null.
 * @param array - The input array.
 * @param callback - The callback function for mapping.
 * @returns A new mapped array or an empty array.
 */
const safeMap = <T, U>(
  array: T[] | undefined,
  callback: (item: T, index: number) => U
): U[] => {
  return Array.isArray(array) ? array.map(callback) : [];
};

const decimalCeil = (value: number, precision: number): number => {
  const factor = Math.pow(10, -precision);
  return Math.ceil(value * factor) / factor;
};

const mapBudgetPay = (productObj: any, price: number): object => {
  const installments = productObj?.c_installmentsNumber || 1;
  return {
    count: installments,
    price: decimalCeil(price / installments, -2),
    status: productObj?.c_hasBudgetPay || false,
  };
};

/**
 * Merges the variant data with the corresponding variationData object.
 * @param variants - List of variants.
 * @param c_variationData - Corresponding variation data.
 * @returns Merged variants with additional fields.
 */
const mergeVariants = (variants: any[] = [], c_variationData: any[] = []) => {
  return safeMap(c_variationData, (variant) => {
    const variation = variants.find((v) => v.productId === variant.productId);
    return {
      ...variant,
      ...variation,
      strikeOutPrice:
        (variation?.tieredPrices || []).find(
          (tieredPrice: any) =>
            tieredPrice?.pricebook === "shoplc-usd-pricebook"
        )?.price ||
        variation?.price ||
        0,
      isClearance: variant?.c_isClearance || false,
      link: `/${slugify(variation?.name)}/p/${variation?.productId}.html`,
      budgetPay: mapBudgetPay(variant, variation?.price),
      youSaveValue: calculateSaveValue(
        variation?.price,
        variant?.c_estimatedPrice
      ),
    };
  });
};

/**
 * Calculates the percentage saved based on the original and current prices.
 * @param price - Current price.
 * @param estimatedPrice - Original estimated price.
 * @returns Percentage of savings.
 */
const calculateSaveValue = (price: number = 0, estimatedPrice: number = 0) => {
  return estimatedPrice > 0
    ? Math.round(100 - (price / estimatedPrice) * 100)
    : 0;
};

/**
 * Maps the product data and sorting options to a standardized format.
 * @param data - Input data containing product and sorting information.
 * @returns Standardized product data and sorting options.
 */
export const productListMapping = async (
  data: any,
  offset: number,
  pageSize: number = 60
): Promise<object> => {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid data provided.");
  }

  const {
    hits = [],
    sortingOptions = [],
    selectedSortingOption = "",
    refinements = [],
    selectedRefinements = {},
    total = 0,
  } = data;

  const selected_sorting_option = selectedSortingOption?.toLowerCase() || "";

  const [products, sortBy, filter] = await Promise.all([
    // Map product details
    Promise.all(
      safeMap(hits, async (v: any) => {
        const productData = v?.representedProduct || {};
        return {
          name: v?.productName || "",
          genericName: generateGenericName(v?.productName),
          productId: productData?.id || "",
          sku: productData?.id || "",
          link: `/${slugify(v?.productName)}/p/${productData?.id}.html`,
          productLabelBadge: productData?.c_productLabelBadge || "",
          isClearance: productData?.c_isClearance || false,
          budgetPay: mapBudgetPay(productData, v?.price),
          images: safeMap(
            productData?.c_sirvImgData?.split(";"),
            (image: string) => `https://image.shoplc.com${image}?w=300&h=300`
          ),
          swatchImage: productData?.c_sirvImgData
            ? `https://image.shoplc.com${
                productData.c_sirvImgData.split(";")[0]
              }?w=46&h=46`
            : null,
          price: v?.price || 0,
          tieredPrices: v?.tieredPrices || [],
          strikeOutPrice:
            (v?.tieredPrices || []).find(
              (tieredPrice: any) =>
                tieredPrice?.pricebook === "shoplc-usd-pricebook"
            )?.price || v?.price,
          estimatedPrice: productData?.c_estimatedPrice || "",
          youSaveValue: calculateSaveValue(
            v?.variants?.[0]?.price || v?.price,
            productData?.c_estimatedPrice
          ),
          promotionCodes: productData?.c_promotionCodes || [],
          variants: mergeVariants(v?.variants, v?.c_variationData),
          variationAttributes: v?.variationAttributes || [],
        };
      })
    ),

    // Map sorting options
    sortingOptions.map((x: any) => ({
      label: x?.label || "",
      value: x?.id || "",
      selected: x?.id === selected_sorting_option,
    })),

    // Map refinements
    safeMap(refinements, (y: any) => ({
      isSingleSelector: y?.attributeId === "price",
      selected: !!selectedRefinements?.[y?.attributeId],
      attributeId: y?.attributeId || "",
      category: y?.label || "",
      params: safeMap(y?.values, (z: any) => ({
        selected: !!selectedRefinements?.[y?.attributeId]
          ?.split("|")
          .includes(z?.value),
        label: z?.label || "",
        value: z?.value || "",
        count: z?.hitCount || 0,
      })),
    })),
  ]);

  const page = Math.ceil((offset + 1) / pageSize);
  const totalPages = Math.ceil(total / pageSize);

  const pageMetadata = {
    categoryName: hits[0]?.c_categoryName || "",
    categoryDescription: hits[0]?.c_categoryDescription || "",
    categoryKeywords: hits[0]?.c_categoryKeywords || "",
  };

  return {
    pageMetadata,
    totalProduct: total,
    totalPages,
    currentPage: page,
    products,
    sort: sortBy,
    filter,
    selectedSortingOption,
    selectedRefinements,
  };
};
