import React from 'react';
import { rest } from 'msw';
import { MOCK_API_URL } from '../../../mocks/constants';
import { server } from '../../../mocks/server';
import { render, screen, userEvent, waitFor } from '../../../test/test-utils';
import { CatalogView } from './CatalogView';

const addProduct = jest.fn();

describe('<CatalogView />', () => {
  test('renders correctly', async () => {
    render(<CatalogView />);

    // expect 16 products
    const products = await screen.findAllByTestId('product');
    expect(products.length).toBe(16);
  });

  test('renders an error if fetching of the catalog fails', async () => {
    // simulate an error when fetching the catalog
    server.use(
      rest.get(`${MOCK_API_URL}/catalog`, (req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    // suppress console errors
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<CatalogView />);
    const errorMessage = await screen.findByText(/404/);
    expect(errorMessage).toBeInTheDocument();

    // restore console errors
    jest.restoreAllMocks();
  });

  test('when a product is clicked, it is added to the cart', async () => {
    // mock add product to cart
    server.use(
      rest.post(`${MOCK_API_URL}/cart/items`, (req, res, ctx) => {
        const { productId } = req.body as { productId: string };
        addProduct(productId);
        return res(ctx.status(200), ctx.json({ items: [] }));
      })
    );

    render(<CatalogView />);

    // click on the first product
    const products = await screen.findAllByTestId('product');
    userEvent.click(products[0]);

    // expect product to be added to the cart
    await waitFor(() => expect(addProduct).toBeCalledTimes(1));
    expect(addProduct).toBeCalledWith('apple-imac');
  });
});
