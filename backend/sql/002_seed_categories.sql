BEGIN;

INSERT INTO categories (
  user_id,
  name,
  slug,
  flow_type,
  icon_key,
  color_hex,
  sort_order,
  is_system,
  is_active
)
SELECT
  NULL,
  v.name,
  v.slug,
  v.flow_type::category_flow_type,
  v.icon_key,
  v.color_hex,
  v.sort_order,
  TRUE,
  TRUE
FROM (
  VALUES
    ('Tiền lương', 'tien-luong', 'income', 'wallet', '#4CAF50', 1),
    ('Đầu tư', 'dau-tu', 'income', 'trending-up', '#2196F3', 2),
    ('Ăn uống', 'an-uong', 'expense', 'utensils', '#FF6B6B', 10),
    ('Di chuyển', 'di-chuyen', 'expense', 'car', '#4ECDC4', 11),
    ('Mua sắm', 'mua-sam', 'expense', 'shopping-bag', '#45B7D1', 12),
    ('Giải trí', 'giai-tri', 'expense', 'film', '#96CEB4', 13),
    ('Y tế', 'y-te', 'expense', 'heart', '#FF8A80', 14),
    ('Nhà cửa', 'nha-cua', 'expense', 'home', '#98D8C8', 15),
    ('Khác', 'khac', 'expense', 'circle', '#BDBDBD', 16)
) AS v(name, slug, flow_type, icon_key, color_hex, sort_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM categories c
  WHERE c.user_id IS NULL
    AND c.slug = v.slug
    AND c.flow_type = v.flow_type::category_flow_type
);

COMMIT;