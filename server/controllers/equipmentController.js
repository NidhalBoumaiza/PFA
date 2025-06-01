import Equipment from '../models/Equipment.js';

export const getEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find()
      .populate('assignedTo')
      .populate('teamId');
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createEquipment = async (req, res) => {
  try {
    const equipment = new Equipment(req.body);
    const savedEquipment = await equipment.save();
    res.status(201).json(savedEquipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateEquipment = async (req, res) => {
  try {
    const equipmentId = req.params.id;
    const updateData = { ...req.body };
    
    // If we're clearing the assignedTo field, also update status to available
    if (updateData.hasOwnProperty('assignedTo') && !updateData.assignedTo) {
      updateData.status = 'available';
      updateData.$unset = { assignedTo: "" };
    }
    
    // If we're assigning to someone, update status to assigned
    if (updateData.assignedTo) {
      updateData.status = 'assigned';
      updateData.assignedDate = new Date();
    }
    
    const updatedEquipment = await Equipment.findByIdAndUpdate(
      equipmentId,
      updateData,
      { new: true }
    )
      .populate('assignedTo')
      .populate('teamId');
      
    res.json(updatedEquipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEquipment = async (req, res) => {
  try {
    await Equipment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};