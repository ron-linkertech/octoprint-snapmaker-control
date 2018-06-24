SECTION_NAME = 'Snapmaker controls'
NORMAL_CHILDREN = [
    { 'name': 'No laser or CNC detected.', 'layout': 'horizontal' , 'children': []}
]
LASER_CHILDREN = [
    { 
        'name': 'Laser status',
        'children': [
            {
                'name': 'Laser Power on',
                'command': 'M03 S%(power)s',
                'input': [
                    {
                        'name': 'Power',
                        'parameter': 'power',
                        'default': 200,
                        'slider': {'min': 0, 'max': 255}
                    }
                ]
            },
            {
                'name': 'Off',
                'command': 'M05'
            }
        ]
    }
]

CNC_CHILDREN = [
    { 
        'name': 'CNC Tool status',
        'children': [
            {
                'name': 'On',
                'command': 'M03'
            },
            {
                'name': 'Off',
                'command': 'M05'
            }
        ]
    }
]

TOOL_CONTROLS = [
    {
        'name': SECTION_NAME,
        'type': 'section',
        'layout': 'horizontal',
        'children': [
            { 'name': 'No laser or CNC detected.' }
        ]
    }
]
