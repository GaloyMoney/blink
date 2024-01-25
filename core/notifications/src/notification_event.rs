use crate::primitives::*;

#[derive(Debug)]
pub struct CircleGrew {
    pub user_id: GaloyUserId,
    pub circle_type: CircleType,
    pub this_month_circle_size: u32,
    pub all_time_circle_size: u32,
}
