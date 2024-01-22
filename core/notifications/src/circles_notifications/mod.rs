pub enum CircleType {
    Inner,
    Outer,
}

pub enum ThresholdType {
    ThisMonth,
    AllTime,
}

pub enum CirclesEvent {
    CircleGrew {
        circle_type: CircleType,
        this_month_circle_size: u32,
        all_time_circle_size: u32,
    },
    CircleThresholdReached {
        circle_type: CircleType,
        threshold_type: ThresholdType,
        threshold: u32,
    },
}
