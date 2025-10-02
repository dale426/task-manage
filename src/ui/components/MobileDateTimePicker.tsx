import { useState } from 'react';
import { Button, Modal, Input, Grid } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

interface MobileDateTimePickerProps {
  value?: Dayjs;
  onChange?: (value: Dayjs | null) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export default function MobileDateTimePicker({
  value,
  onChange,
  placeholder = "选择日期时间",
  style,
  disabled = false
}: MobileDateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('');
  const screens = Grid.useBreakpoint();

  // 在移动端使用原生日期时间选择器，桌面端使用Ant Design组件
  const isMobile = !screens.md;

  const handleOpen = () => {
    if (disabled) return;
    
    if (value) {
      setTempDate(value.format('YYYY-MM-DD'));
      setTempTime(value.format('HH:mm'));
    } else {
      const now = dayjs();
      setTempDate(now.format('YYYY-MM-DD'));
      setTempTime(now.format('HH:mm'));
    }
    setOpen(true);
  };

  const handleConfirm = () => {
    if (tempDate && tempTime) {
      const dateTime = dayjs(`${tempDate} ${tempTime}`);
      onChange?.(dateTime);
    }
    setOpen(false);
  };

  const handleClear = () => {
    onChange?.(null);
    setOpen(false);
  };

  const displayValue = value ? value.format('YYYY-MM-DD HH:mm') : '';

  if (isMobile) {
    return (
      <>
        <Button
          style={{ 
            width: '100%', 
            textAlign: 'left', 
            justifyContent: 'flex-start',
            ...style 
          }}
          onClick={handleOpen}
          disabled={disabled}
          icon={<CalendarOutlined />}
        >
          {displayValue || placeholder}
        </Button>
        
        <Modal
          title="选择日期时间"
          open={open}
          onCancel={() => setOpen(false)}
          footer={[
            <Button key="clear" onClick={handleClear}>
              清除
            </Button>,
            <Button key="cancel" onClick={() => setOpen(false)}>
              取消
            </Button>,
            <Button key="confirm" type="primary" onClick={handleConfirm}>
              确定
            </Button>,
          ]}
          width="90%"
          style={{ top: 20 }}
        >
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                日期
              </label>
              <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: '#fff'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                时间
              </label>
              <input
                type="time"
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: '#fff'
                }}
              />
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // 桌面端使用简单的输入框
  return (
    <Input
      value={displayValue}
      placeholder={placeholder}
      readOnly
      onClick={handleOpen}
      style={{ cursor: 'pointer', ...style }}
      disabled={disabled}
      suffix={<CalendarOutlined />}
    />
  );
}
