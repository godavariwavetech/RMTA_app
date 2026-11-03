export const toMenuIds = value => {
  if (value === undefined || value === null) return null;
  let list = value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch (e) {
      list = list.split(',');
    }
  }
  if (!Array.isArray(list)) return null;
  return list.map(Number).filter(n => Number.isFinite(n));
};

export const canAccessTechnicianMenu = (user, menuId) => {
  if (!user || !user.tech_id) return true;
  const menuIds = toMenuIds(user.menu_ids);
  return !!menuIds && menuIds.includes(Number(menuId));
};
