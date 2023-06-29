import { CacheKeys } from "@domain/cache"
import * as PriceServiceImpl from "@services/price"
import { LocalCacheService } from "@services/cache/local-cache"
import { PriceCurrenciesNotAvailableError } from "@domain/price"
import { listCurrencies } from "@app/prices"

jest.mock("@config", () => {
  const config = jest.requireActual("@config")
  const getLndParams = (): LndParams[] => []
  return { ...config, getLndParams }
})

jest.mock("@services/tracing", () => ({
  wrapAsyncFunctionsToRunInSpan: ({ fns }) => fns,
}))

beforeEach(async () => {
  await LocalCacheService().clear({ key: CacheKeys.PriceCurrencies })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe("Prices", () => {
  describe("listCurrencies", () => {
    it("returns cached currencies", async () => {
      jest
        .spyOn(PriceServiceImpl, "PriceService")
        .mockImplementationOnce(() => ({
          listHistory: jest.fn(),
          getSatRealTimePrice: jest.fn(),
          getUsdCentRealTimePrice: jest.fn(),
          listCurrencies: () =>
            Promise.resolve([
              {
                code: "USD",
                symbol: "$",
                name: "US Dollar",
                flag: "🇺🇸",
                fractionDigits: 2,
              },
            ]),
        }))
        .mockImplementationOnce(() => ({
          listHistory: jest.fn(),
          getSatRealTimePrice: jest.fn(),
          getUsdCentRealTimePrice: jest.fn(),
          listCurrencies: () => Promise.resolve(new PriceCurrenciesNotAvailableError()),
        }))

      const currencies = await listCurrencies()
      expect(currencies).not.toBeInstanceOf(Error)

      if (currencies instanceof Error) throw currencies
      expect(currencies.length).toEqual(1)
      expect(currencies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: expect.any(String),
            symbol: expect.any(String),
            name: expect.any(String),
            flag: expect.any(String),
            fractionDigits: expect.any(Number),
          }),
        ]),
      )

      const cachedCurrencies = await listCurrencies()
      expect(cachedCurrencies).toEqual(currencies)
    })

    it("fails when listCurrencies fails and cache is empty", async () => {
      jest.spyOn(PriceServiceImpl, "PriceService").mockImplementationOnce(() => ({
        listHistory: jest.fn(),
        getSatRealTimePrice: jest.fn(),
        getUsdCentRealTimePrice: jest.fn(),
        listCurrencies: () => Promise.resolve(new PriceCurrenciesNotAvailableError()),
      }))

      const currencies = await listCurrencies()
      expect(currencies).toBeInstanceOf(PriceCurrenciesNotAvailableError)
    })
  })
})
