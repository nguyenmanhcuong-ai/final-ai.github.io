
const { DataTypes, BOOLEAN } = require('sequelize');
const sequelize = require('../config/sequelize');

const Products = sequelize.define('products', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dateCreate: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  priceImport: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  priceSale: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  qrCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isBought: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  
}, {
  timestamps: false, // Tắt chức năng tự động tạo createdAt và updatedAt
});


const getProductsForCatalog = async () => {
  try {
    // Fetch the list of products from the 'products' table
    const productsList = await Products.findAll({
      attributes: ['id', 'image', 'name', 'dateCreate', 'priceImport', 'priceSale', 'type', 'description', 'qrCode'],
    });

    // Convert Sequelize instances to plain JSON objects
    const productsData = productsList.map((product) => product.toJSON());

    return productsData;
  } catch (error) {
    console.error('Error getting product list:', error.message);
    throw new Error(`Error getting product list: ${error.message}`);
  }
};

const saveProduct = async ({
  name,
  priceSale,
  type,
  dateCreate,
  priceImport,
  description,
  qrCode,
  image, // Assuming 'image' is the binary data of the image
}) => {
  try {

    // Create a new product with the image in base64 format
    const newProduct = await Products.create({
      name,
      priceSale,
      type,
      dateCreate,
      priceImport,
      description,
      qrCode,
      image,
      isBought: false, // Set the default value for isBought
    });

    return newProduct.toJSON();
  } catch (error) {
    console.error('Error saving product:', error);
    throw new Error('Error saving product: ' + error.message);
  }
};

const   getProductById = async (productId) => {
  try {
    const product = await Products.findByPk(productId);

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    return { success: true, data: product };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { success: false, error: 'Internal Server Error' };
  }
};


const updateProduct = async (productId, updatedProductData) => {
  console.log('Updated Product Data:', updatedProductData);

  try {
    const [rowsUpdated, [updatedProduct]] = await Products.update(updatedProductData, {
      where: { id: productId },
      returning: true, // Return the updated product
    });

    if (rowsUpdated > 0) {
      console.log('Product updated successfully:', updatedProduct);
      return { success: true, data: updatedProduct, message: 'Product updated successfully' };
    } else {
      console.log('Product not found');
      return { success: false, error: 'Product not found' };
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: 'Failed to update product' };
  }
};

const checkIsBoughtStatus = async (productId) => {
  try {
      const product = await Products.findByPk(productId);

      if (!product) {
          return { success: false, error: 'Product not found' };
      }

      return { success: true, isBought: product.isBought };
  } catch (error) {
      console.error('Error checking isBought status:', error);
      return { success: false, error: 'Internal Server Error' };
  }
};

const deleteProduct = async (productId) => {
  try {
      // Assuming `Products` is your Sequelize model
      const product = await Products.findByPk(productId);

      if (!product) {
          return { success: false, error: 'Product not found' };
      }

      // Check if the product is bought before deleting
      if (product.isBought) {
          return { success: false, error: 'Product is bought and cannot be deleted' };
      }

      // If not bought, proceed with deletion
      const deletedRows = await Products.destroy({
          where: { id: productId },
      });

      if (deletedRows > 0) {
          return { success: true, message: 'Product deleted successfully' };
      } else {
          return { success: false, error: 'Product not found' };
      }
  } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: 'Failed to delete product' };
  }
};

module.exports = {
  getProductsForCatalog,
  saveProduct,
  getProductById,
  updateProduct,
  checkIsBoughtStatus,
  deleteProduct,
};
